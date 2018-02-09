'use strict';

const EventEmitter = require('events');

class NativeScheduler {
    constructor(options) {
        this.options = options;
    }

    /**
     * Scheduler boot sequence, here
     * we can initialize any connections
     * to external services.
     *
     * @return {Promise} Promise resolved on completions
     */
    start() {
        return Promise.resolve();
    }

    stop() {
        clearInterval(this.intervalId);
    }
}

module.exports = NativeScheduler;
