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
