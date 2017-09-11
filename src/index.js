'use strict';

const Application = require('application-core').Application;

let config = Application.loadConfig({});

let app = new Application({
    config
});

/**
 * Once the application has bootstraped
 * then we can start the application.
 * - coreplugins.ready (commands and plugins not loaded)
 * - modules.ready
 * - commands.ready
 */
app.once('modules.ready', () => {
    app.run();
});

app.on('persistence.application.*', (e) => {
    let {identity, action, record, type} = e;

    app.logger.info('persistence:', type, identity, action);

    let topic = 'ww/registry/application/update';

    app.pubsub.publish(topic, {
        topic,
        action,
        record
    });
});
