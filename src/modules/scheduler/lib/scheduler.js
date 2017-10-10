'use strict';

const extend = require('gextend');
const EventEmitter = require('events');
const DEFAULTS = require('./defaults');

/**
 * https://github.com/redibox/job
 * https://github.com/redibox/schedule
 *
 * https://www.npmjs.com/package/redis-scheduler
 * @constructor
 */
class Scheduler extends EventEmitter {
    constructor(config){
        super();
        config = extend({}, DEFAULTS, config);
        if(config.autoinitialize){
            this.init(config);
        }
    }

    init(config={}){
        extend(this, config);
        let Strategy = this.strategyMap[this.strategy];
        this.strategy = new Strategy(this.options);
    }

    schedule(options) {
        console.log('Scheduler.schedule(%j)', options);

        options.handler = (err, event)=>{
            console.log('options.handler', err, event);
            this.tick(event);
        };
        return this.strategy.schedule(options);
    }

    tick(event={}){
        event = this.buildEvent(event);
        console.log('on.tick', event);
        this.emit('schedule.event');
    }

    buildEvent(event={}){
        // event.scheduler = this;
        return event;
    }

    /**
     * Scheduler boot sequence, here
     * we can initialize any connections
     * to external services.
     *
     * @return {Promise} Promise resolved on completions
     */
    boot() {
        return this.strategy.start();
    }
}

module.exports = Scheduler;
