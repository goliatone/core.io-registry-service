'use strict';


function ApplicationCreatedCommand(event){
    let context = event.context;
    let logger = context.getLogger('cmd');

    let {identity, action, record, type} = event;

    logger.info('ApplicationCreatedCommand:', type, identity, action);
    logger.info('ApplicationCreatedCommand:', event.record);

    let topic = 'ww/registry/application/update';

    context.pubsub.publish(topic, {
        topic,
        action,
        record
    });
}


module.exports = ApplicationCreatedCommand;
