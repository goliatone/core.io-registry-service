'use strict';

const EventEmitter = require('events');
const redis = require('redis');
const extend = require('gextend');


const DEFAULTS = {
    host: 'localhost',
    port: 6579,
    db: 0,
    autostart: true,
    timeout: 10 * 1000 //Timeout after 10 seconds
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

        //TODO: move to init(options)

        this.db = options.db;

        this.clients = {};
        this.handlers = {};
        this.patterns = {};

        this._schedules = new Map();

        this.options = options;

        if(options.autostart) {
            this.start(options);
        }
    }

    start(options){
        options = extend({}, this.options, options);

        this.timeout = options.timeout;

        this.clients = {
            listener: createRedisClient(options),
            scheduler: createRedisClient(options)
        };

        this._setRedisEvents();

        /*
         * Try to stablish a connection to redis
         * if we fail to connect in less than
         * `timeout` the promise will be rejected.
         */
        return new Promise((resolve, reject)=>{
            this._initTimeout = setTimeout(()=> {
                reject(new Error('Timeout'));
            }, this.timeout);

            this.clients.listener.once('ready', ()=>{
                clearTimeout(this._initTimeout);
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
        const task = this._addTask(options);

        return new Promise((resolve, reject)=>{

            /*
             * If we are only adding a handler
             * then this would make sense.
             * If we don't provide either
             * expire or handler then it
             * does not make any sense at all
             */
            if(!task.expire) {
                if(!task.isExecutable){
                    console.warn('This call to schedule had no effect!');
                }
                return resolve();
            }

            const {scheduler} = this.clients;

            if(!scheduler) return reject(new Error('Not initialized'));


            const millis = task.millis;
            const _responder = this._promisifyCallback(reject, resolve);

            scheduler.exists(task.key, (err, exists) => {
                if(err) return reject(err);

                if (exists) {
                    /*
                     * Key already exists, we are overwritting
                     * it's expire value with a new value of
                     * `millis`.
                     */
                    scheduler.pexpire(task.key, millis, _responder);
                } else {
                    scheduler.set(task.key, '', 'PX', millis, _responder);
                }
            });
        });
    }

    _addTask(options) {
        let task = new Task(options);
        this._schedules.set(task.key, task);

        if (task.isExecutable) {
            if (task.pattern) {
                this._getHandlersByPattern(task.key).push(task.handler);
            } else {
                this._getHandlersByKey(task.key).push(task.handler);
            }
        }
        return task;
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

const uuid = require('uuid').v4;

class Task {
    constructor(options) {
        this.init(options);
    }

    init(options) {
        if(!options.id) {
            options.id = uuid();
        }

        this.id = options.id;
        this.key = options.key;
        this.expire = options.expire;
        this.handler = options.handler;
        this.reschedule = options.reschedule;

        if(options.pattern) {
            this.pattern = new RegExp(this.key);
        }

        if(typeof this.reschedule === 'number'){
            this.repeat = this.count = this.reschedule;
        }
    }

    get isExecutable(){
        return typeof this.handler === 'function';
    }

    get millis(){
        if (this.expire instanceof Date) {
            const now = new Date().getTime();
            this.expire = this.expire.getTime() - now;
        }

        return this.expire;
    }
}
