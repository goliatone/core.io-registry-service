'use strict';

function RunPostCommand(event) {
    let context = event.context;
    context.getLogger('run-post').info('Execute RunPostCommand...');
}

module.exports = RunPostCommand;
