'use strict';

const EventEmitter = require('events');
const redis = require('redis');
const extend = require('gextend');


const DEFAULTS = {
    host: 'localhost',
    port: 6579,
    db: 0,
    autostart: true
};

/**
 * TODO: Keep track of schedules, assing ID, store
 * key and interval and handler.
 * TODO: Reschedule by schedule ID
 * TODO: schedule options: reschedule:true should
 * make an interval out of the event.
 * reschedule:int should reschedule until int===0.
 *
 * @type {[type]}
 */
class Scheduler extends EventEmitter {

    /**
     * Create a new Scheduler.
     *
     * options:
     * - host=localhost (string) - Redis connection host.
     * - port=6579      (number) - Redis connection port.
     * - db=0           (number) - Redis zero-based numeric database index
     * - path           (string) - Redis pid file
     * - password       (string) - Redis password
     * - redisOptions   (object) - Redis options
     *
     * @param  {Object} [options={}]
     * @return {this}
     */
    constructor(options={}){
        super();

        options = extend({}, DEFAULTS, options);

        this.db = options.db;

        this.clients = {};
        this.handlers = {};
        this.patterns = {};

        this.options = options;

        if(options.autostart) {
            this.start(options);
        }
    }

    start(options){
        options = extend({}, this.options, options);

        this.clients = {
            listener: createRedisClient(options),
            scheduler: createRedisClient(options)
        };

        this._setRedisEvents();

        /*
         * This should be a timeout promise?
         */
        return new Promise((resolve, reject)=>{
            this.clients.listener.once('ready', ()=>{
                resolve();
            });
        });
    }

    /**
     * Use this function to add handlers.
     *
     * You can add multiple handlers per
     * event and you can add event handlers
     * in one process and schedule events in
     * a different process.
     *
     * options:
     * - key     (string)   - The event key to add
     *                        the handler for (can be simple
     *                        string or regex string in case
     *                        of patterns).
     * - handler (function) - The extra handler to add when
     *                        the event is triggered.
     * - pattern (boolean)  - Designates whether key is a
     *                        regular expression.
     *
     * @param {Object} options
     * @return {Promise}
     */
    addHandler(options) {
        return this.schedule(options);
    }

    /**
     * Reschedules a scheduled event.
     * Will take either a new date to
     * trigger or explicit milliseconds.
     *
     * options:
     * - key    (string) - Event to reschedule.
     * - expire (number) - Milliseconds/date to
     *                     reset expiration to.
     *
     * @param  {Object} options
     * @return {Promise}
     */
    reschedule(options) {
        return this.schedule(options);
    }

    /**
     * Add a timed event.
     *
     * options:
     * - key     (string)       - The key of event
     *                            to store.
     * - expire  (date/number)  - Date/number of milliseconds
     *                            until expiration.
     * - handler (function)     - Function to call when scheduled
     *                            time occurs.
     *
     * It is possible to schedule a key that
     * already has an existing schedule.
     * In this case the time to live of a key
     * is updated to the new value.
     *
     * @param  {Object} options
     * @return {Promise}
     */
    schedule(options) {
        const {key, handler, pattern, expire} = options;

        if (handler) {
            if (pattern) {
                this._getHandlersByPattern(key).push(handler);
            } else {
                this._getHandlersByKey(key).push(handler);
            }
        }

        return new Promise((resolve, reject)=>{

            const {scheduler} = this.clients;

            if(!scheduler) return reject(new Error('Not initialized'));

            if(!expire) return resolve();

            const millis = this._getMillis(expire);

            const _responder = this._promisifyCallback(reject, resolve);

            scheduler.exists(key, (err, exists) => {
                if (exists) {
                    //reschedule
                    scheduler.pexpire(key, millis, _responder);
                } else {
                    scheduler.set(key, '', 'PX', millis, _responder);
                }
            });
        });
    }

    _promisifyCallback(reject, resolve){
        return function _promiseCallback(err, res) {
            if(err) reject(err);
            else resolve(res);
        };
    }

    /**
     * Cancels a scheduled event
     * and cleans up handlers.
     *
     * @param  {String} key
     * @return {Promise}
     */
    cancel(key) {
        return new Promise((resolve, reject)=>{
            this.clients.scheduler.del(key, (err)=>{
                delete(this.handlers[key]);
                delete(this.patterns[key]);
                if(err) reject(err);
                else resolve();
            });
        });
    }

    end() {
        this._cleanup();
        this.clients.listener.end();
        this.clients.scheduler.end();
    }

    /**
     * The keyspace `key` has been expired.
     * We should check for pattern handlers
     * or literal handlers.
     *
     * @param  {String} key Name of key expired
     * @return {void}
     */
    _handleExpireEvent(key) {

        this._checkForPatternMatches(key);

        if (this.handlers.hasOwnProperty(key)) {
            this.handlers[key].forEach((handler)=>{
                handler(null, {key});
            });
        }
    }

    _checkForPatternMatches(key) {
        const handlersToSend = [];

        for (var pattern in this.patterns) {
            if (this.patterns[pattern].key.test(key)) {
                handlersToSend = handlersToSend.concat(this.patterns[pattern].handlers);
            }
        }

        handlersToSend.forEach((handler)=>{
            handler(null, {key});
        });
    }

    _getMillis(expiration) {
        if (expiration instanceof Date) {
            const now = new Date().getTime();
            expiration = expiration.getTime() - now;
      }

      return expiration;
    }

    _setRedisEvents() {
        this._cleanup();

        const {listener, scheduler} = this.clients;

        listener.on('ready', ()=>{
            console.log('ready');
            this.emit('ready', 'listener');
        });

        listener.on('connect', ()=>{
            this.emit('connect', 'listener');
        });

        listener.on('drain', ()=>{
            this.emit('drain', 'listener');
        });

        listener.on('idle', ()=>{
            this.emit('idle', 'listener');
        });

        scheduler.on('ready', ()=>{
            this.emit('ready', 'scheduler');
        });

        scheduler.on('connect', ()=>{
            this.emit('connect', 'scheduler');
        });

        scheduler.on('drain', ()=>{
            this.emit('drain', 'scheduler');
        });

        scheduler.on('idle', ()=>{
            this.emit('idle', 'scheduler');
        });

        /*
         * handle all incomming expired events.
         * Just route it
         */
        listener.on('message', (channel, message) => {
            this._handleExpireEvent(message);
        });

        listener.subscribe(`__keyevent@${this.db}__:expired`);
    }

    _cleanup() {
      this.clients.listener.removeAllListeners();
      this.clients.scheduler.removeAllListeners();

      this.clients.listener.unsubscribe(`__keyevent@${this.db}__:expired`);
      this.handlers = [];
    }

    _getHandlersByKey(key){
        if (!this.handlers.hasOwnProperty(key)) {
            this.handlers[key] = [];
        }
        return this.handlers[key];
    }

    _getHandlerByPattern(pattern){
        if (!this.patterns.hasOwnProperty(pattern)) {
            this.patterns[pattern] = {
                key: new RegExp(pattern),
                handlers: []
            };
        }

        return this.patterns[pattern].handlers;
    }
}


module.exports = Scheduler;

function createRedisClient(options={}) {
    let client;

    let {
        host='localhost',
        port=6379,
        path,
        db,
        password,
        redisOptions
    } = options;

    if (path) {
        client = redis.createClient(path, redisOptions);
    } else {
        client = redis.createClient(port, host, redisOptions);
    }

    if (password) {
        client.auth(password);
    }

    if (db) {
        client.select(db);
    }

    return client;
}
