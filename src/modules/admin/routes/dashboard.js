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

    router.get('/dashboard', (req, res)=>{
        res.render('dashboard');
    });
    
    return router;
}
