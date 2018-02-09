'use strict';

const Scheduler = require('./lib/scheduler');

/**
 * https://bunkat.github.io/later/
 * http://bunkat.github.io/schedule/
 * https://www.npmjs.com/package/node-schedule
 *
 * Intialization routing. Here we expose
 * our scheduler Service to be available
 * through the app.
 * @param  {Object} context Application instance
 * @param  {Object} config  Config object
 * @return {void}
 */
module.exports.init = function(context, config) {
    if (!config.logger) {
        config.logger = context.getLogger('scheduler');
    }

    let scheduler = new Scheduler(config);

    scheduler.boot().then(() => {
        config.logger.info('Scheduler ready...');
        context.provide('scheduler', scheduler);
    }).catch((err) => {
        config.logger.error('Scheduler failed to boot');
        config.logger.error('Err:', err.message);
        config.logger.error(err.stack);
        throw new Error('Scheduler failed to boot');
    });
};
