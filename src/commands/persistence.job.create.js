'use strict';

function JobCreatedCommand(event){
    let context = event.context;
    let logger = context.getLogger('cmd');
    let record = event.record;
    let Job = context.models.Job;

    logger.info('JobCreatedCommand', record);

    let interval = record.interval;

    setInterval(()=>{
        console.log('ping ', record.endpoint);
    }, interval);
}

module.exports = JobCreatedCommand;
