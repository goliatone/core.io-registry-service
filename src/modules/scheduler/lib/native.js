'use strict';

const EventEmitter = require('events');

class NativeScheduler {
    constructor(scheduler, options){
        this.options = options;
        this.scheduler = scheduler;
    }

    /**
     * Scheduler boot sequence, here
     * we can initialize any connections
     * to external services.
     *
     * @return {Promise} Promise resolved on completions
     */
    boot() {
        return Promise.resolve();
    }

    start() {
        this.intervalId = setInterval(()=>{
            this.tick();
        }, this.interval);
    }

    stop(){
        clearInterval(this.intervalId);
    }

    tick() {
        this.scheduler.tick();
    }
}

module.exports = NativeScheduler;
