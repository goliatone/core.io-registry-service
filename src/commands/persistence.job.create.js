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
    let logger = context.getLogger('per.job.crt');
    let record = event.record;
    let Job = context.models.Job;

    logger.info('JobCreatedCommand', record, event.id);

    /*
     * This simulates the Scheduler's purpose:
     *
     */
    let interval = record.interval;

    context.scheduler.schedule({
        key: record.id,
        expire: interval
    }).then(() => {
        logger.warn('Job Scheduled!!! will fire in %s', interval);
    });

    context.scheduler.on('schedule.event', (e) => {

        logger.info('schedule.event => schedule.ping', e);

        context.emit('schedule.ping', {
            record,
            key: record.id,
            expire: interval
        });
    });

    context.scheduler.strategy.addHandler({
        key: record.id,
        handler: ()=>{
            logger.info('handler for job', record.id);

            // context.emit('schedule.ping', {
            //     record,
            //     key: record.id,
            //     expire: interval
            // });

            context.scheduler.strategy.reschedule({
                key: record.id,
                expire: interval
            });
        }
    });
}

module.exports = JobCreatedCommand;
