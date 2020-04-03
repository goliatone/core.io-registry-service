/*jshint esversion:6, node:true*/
'use strict';

const express = require('express');

/**
 * Standard entry point for TrackFinder
 * routes. We are not in the appliction
 * context scope.
 *
 * @method exports
 * @param  {Object} router Express router
 * @param  {Object} config
 * @param  {Object} subapp Express app to
 *                         be mounted.
 * @return {void}
 */
module.exports = function(router, config, subapp){

    initialize(subapp, config);

    router.use('/', subapp);
};

function initialize(router, config){
    // let router = express.Router();

    const context = config.context;
    const logger = context.getLogger('endpoints');

    config.scaffold = config.scaffold || {};
    config.scaffold.logger = config.context.getLogger('crud');

    require('waterline-crud')(router, config.scaffold);

    registerCRUD(router, config, []);

    return router;
}

function registerCRUD(app, config, middleware) {
    let identities = {};
    let logger = config.logger;
    let context = config.context;

    Object.keys(context.models).map((modelId) => {
        modelId = modelId.toLowerCase();
        /*
         * We might have exported User and user.
         */
        if(identities[modelId]) return;
        logger.info('CRUD Registering "%s" routes', modelId);
        identities[modelId] = true;

        /*
         * We should scaffold the
         */
        app.crud(modelId, middleware, context.models[modelId]);
    });
}
