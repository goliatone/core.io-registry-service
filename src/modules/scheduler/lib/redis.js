'use strict';

const EventEmitter = require('events');
const redis = require('redis');
const extend = require('gextend');

const DEFAULTS = {
    logger: console,
    host: 'localhost',
    port: 6579,
    db: 0,
    autostart: false,
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
    constructor(options = {}) {
        super();

        options = extend({}, DEFAULTS, options);

        //TODO: move to init(options)

        this.logger = options.logger;

        this.db = options.db;

        this.clients = {};

        this._tasks = new Map();
        this._schedules = new Map();

        this.options = options;

        if (options.autostart) {
            this.start(options);
        }
    }

    start(options) {
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
        return new Promise((resolve, reject) => {
            this._initTimeout = setTimeout(() => {
                reject(new Error('Timeout'));
            }, this.timeout);

            this.clients.listener.once('ready', () => {
                clearTimeout(this._initTimeout);
                //TODO: we should ensureNotifyKeyspaceEventSet is set
                //before we resolve this :)
                // resolve();
                this.ensureNotifyKeyspaceEventSet()
                    .then(resolve)
                    .catch(reject);
            });
        });
    }

    /** 
     * Check that our redis instance is configured
     * properly, that is `notify-keyspace-event`
     * MUST be set to **Ex**.  
     */
    ensureNotifyKeyspaceEventSet() {
        return new Promise((resolve, reject) => {
            
            this.clients.scheduler.CONFIG('GET', 'notify*', (err, value) => {
                if (err) {
                    this.logger.info('notify-keyspace-event error:', err);
                    return reject(err);
                }

                if (!value || (Array.isArray(value) && value.length < 2)) {
                    this.logger.info('notify-keyspace-event NOT set', value);
                    return reject(new Error('Invalid configuration: notify-keyspace-event NOT set'));
                }

                let [_, chars] = value;
                if(!chars.includes('E') || !chars.includes('x')) {
                    this.logger.info('notify-keyspace-event NOT configured, need "Ex", have %s', chars);
                    return reject(new Error('Invalid configuration: notify-keyspace-event NOT set'));
                }

                this.logger.info('notify-keyspace-event is set: "%s"', chars);

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
        options._type = 'addHandler';
        this.logger.info('addHandler');
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
        this.logger.info('reschedule');
        options._type = 'reschedule';
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
     * We can use patterns for handlers, but
     * does not make sense for schedules.
     *
     * @param  {Object} options
     * @return {Promise}
     */
    schedule(options) {
        const task = this._addTask(options);
        this.logger.info('-> schedule(%j)', options);

        return new Promise((resolve, reject) => {
            /*
             * If we are only adding a handler
             * then this would make sense.
             * If we don't provide either
             * expire or handler then it
             * does not make any sense at all
             */
            if (!task.expire) {
                if (!task.isExecutable) {
                    this.logger.warn('This call to schedule had no effect!');
                }
                return resolve(task);
            }

            const { scheduler } = this.clients;

            if (!scheduler) return reject(new Error('Not initialized'));

            const millis = task.millis;
            const _responder = this._promisifyCallback(task, reject, resolve);

            scheduler.exists(task.key, (err, exists) => {
                if (err) return reject(err);

                if (exists) {
                    this.logger.info('register using pexpire');
                    /*
                     * Key already exists, we are overwritting
                     * it's expire value with a new value of
                     * `millis`.
                     */
                    scheduler.pexpire(task.key, millis, _responder);
                } else {
                    this.logger.info('register using set');
                    scheduler.set(task.key, task.serialize(), 'PX', millis, _responder);
                }
            });
        });
    }

    _addTask(options) {
        let task;
        if (options.id) {
            console.log('_addTask: id = %s', options.id);
            task = this._tasks.get(options.id);
            return task;
        } else {
            task = new Task(options);
            this._tasks.set(task.id, task);
        }

        if (!this._schedules.has(task.key)) {
            this._schedules.set(task.key, []);
        }

        let tasks = this._schedules.get(task.key);
        tasks.push(task);

        return task;
    }

    _removeTask(task) {
        this._tasks.delete(task.id);

        let tasks = this._schedules.get(task.key);

        let i = 0,
            l = tasks.length,
            t;

        for (; i < l; i++) {
            t = tasks[i];
            if (t && t.id === task.id) {
                tasks.splice(i, 1);
            }
        }
    }

    _promisifyCallback(task, reject, resolve) {
        return function _promiseCallback(err, res) {
            if (err) reject(err);
            else resolve(task);
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
        return new Promise((resolve, reject) => {
            this.clients.scheduler.del(key, err => {
                this._schedules.set(key, []);
                if (err) reject(err);
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
        let time = Date.now();

        let tasks = this._schedules.get(key);

        if (!tasks) {
            return this.logger.warn('expired event %s has no tasks', key);
        }

        this.logger.warn('handleExpireEvent');
        this.logger.warn('total tasks: %s', tasks.length);
        this.logger.warn('key: %s', key);
        this.logger.warn('time: %s', time);

        tasks.forEach(task => {
            if (task.matches(key)) {
                this.logger.warn('run task %s for %s', task.type, key);

                task.run();

                if (task.needsReschedule) {
                    this.reschedule({ id: task.id });
                } else {
                    this._removeTask(task);
                }
            }
        });
    }

    _setRedisEvents() {
        this._cleanup();

        const { listener, scheduler } = this.clients;

        listener.on('ready', () => {
            this.logger.log('ready');
            this.emit('ready', 'listener');
        });

        listener.on('connect', () => {
            this.emit('connect', 'listener');
        });

        listener.on('drain', () => {
            this.emit('drain', 'listener');
        });

        listener.on('idle', () => {
            this.emit('idle', 'listener');
        });

        scheduler.on('ready', () => {
            this.emit('ready', 'scheduler');
        });

        scheduler.on('connect', () => {
            this.emit('connect', 'scheduler');
        });

        scheduler.on('drain', () => {
            this.emit('drain', 'scheduler');
        });

        scheduler.on('idle', () => {
            this.emit('idle', 'scheduler');
        });

        /*
         * handle all incomming expired events.
         * Just route it
         */
        listener.on('message', (channel, message) => {
            this.logger.info('-------');
            this.logger.info('message', channel, message);
            this._handleExpireEvent(message);
        });

        listener.subscribe(`__keyevent@${this.db}__:expired`);
    }

    _cleanup() {
        this.clients.listener.removeAllListeners();
        this.clients.scheduler.removeAllListeners();

        this.clients.listener.unsubscribe(`__keyevent@${this.db}__:expired`);
        this._tasks = new Map();
        this._schedules = new Map();
    }
}

module.exports = Scheduler;

function createRedisClient(options = {}) {
    let client;

    let {
        host = 'localhost',
        port = 6379,
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

/*
 * Tasks should be serialized in redis.
 * So we can pull expire from different
 * threads and we can call to reschedule
 * from there...
 */
class Task {
    constructor(options) {
        this.init(options);
    }

    init(options) {
        if (!options.id) {
            options.id = uuid();
        }

        this.reschedule = false;

        extend(this, options);

        /*
         * We want to expose the
         * type on our task object.
         */
        // this.type = options._type;

        this.runs = 0;

        if (options.pattern) {
            this.pattern = new RegExp(this.key);
        }

        if (typeof this.reschedule === 'number') {
            this.repeat = this.reschedule;
            this.reschedule = true;
        }
    }

    fromJSON(data) {
        extend(this, data);
    }

    toJSON() {
        return {
            id: this.id,
            key: this.key,
            data: this.data,
            runs: this.runs,
            repeat: this.repeat,
            pattern: this.pattern,
            reschedule: this.reschedule
        };
    }
    serialize(){
        let out = this.toJSON();
        return JSON.stringify(out);
    }

    deserialize(data) {
        let json = JSON.parse(data);
        this.fromJSON(json);
    }


    matches(key) {
        if (this.pattern) {
            return this.pattern.test(key);
        }
        return this.key === key;
    }

    run(err) {
        if (this.runExceeded) {
            return;
        }

        this.runs++;

        if (this.isExecutable) {
            this.handler(err, this);
        }
    }

    get type() {
        return this._type;
    }

    set type(v) {}

    get runExceeded() {
        if (this.repeat && this.repeat === this.runs) {
            return true;
        }
        return false;
    }

    get needsReschedule() {
        if (this.repeat) {
            return !this.runExceeded;
        }
        return this.reschedule;
    }

    get isExecutable() {
        return typeof this.handler === 'function';
    }

    get millis() {
        if (this.expire instanceof Date) {
            this.expire = this.expire.getTime() - Date.now();
        }

        return this.expire;
    }
}
