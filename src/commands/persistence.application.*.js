'use strict';

function ApplicationCreatedCommand(event) {
    const context = event.context;
    const logger = context.getLogger('app.crt.cmd');
    const StatusEvent = context.models.StatusEvent;

    let { identity, action, record, type } = event;

    let application = record;

    logger.info('ApplicationCreatedCommand:', type, identity, action);
    logger.info('ApplicationCreatedCommand:', application);

    const topic = 'ww/registry/application/update';
    const online = application.online;

    let notice = {
        application: application.id,
        // tags: job.tags,
        label: online ? 'register' : 'unregister',
        description: `Application ${application.appId} is now ${
            online ? 'online' : 'offline'
        }`
    };

    context.pubsub.publish(topic, {
        topic,
        action,
        application
    });

    return StatusEvent.create(notice).then(() => {
        logger.info('created status event...');
    });
}

module.exports = ApplicationCreatedCommand;
