'use strict';

/**
 * After a Job has been created this
 * command will schedule it's execution.
 *
 * Then, the schedule will load the job
 * description on every tick, execute
 * the correspoding command- e.j Ping-
 * and update the Job record.
 *
 * @param       {Object} event
 */
function JobCreatedCommand(event){
    let context = event.context;
    let logger = context.getLogger('cmd');
    let record = event.record;
    let Job = context.models.Job;

    logger.info('JobCreatedCommand', record);

    /*
     * This simulates the Scheduler's purpose:
     * 
     */
    let interval = record.interval;

    setInterval(() => {
        context.emit('schedule.ping', {record});
    }, interval);
}

module.exports = JobCreatedCommand;
