'use strict';

const extend = require('gextend');
const EventEmitter = require('events');
const DEFAULTS = require('./defaults');


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
        this.strategy = new Strategy(this, this.options);
    }

    /**
     * Scheduler boot sequence, here
     * we can initialize any connections
     * to external services.
     *
     * @return {Promise} Promise resolved on completions
     */
    boot() {
        return this.strategy.boot();
    }
}

module.exports = Scheduler;
