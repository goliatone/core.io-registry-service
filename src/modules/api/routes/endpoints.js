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

    const Job = context.models.Job;
    const Application = context.models.Application;
    
    /**
     * GET home page.
     */
    router.get('/health', function healthHandler(req, res, next) {
        res.send({
            status: true
        });
    });

    /**
     * Register a new application instance.
     * A new application get's an ID which is
     * sent back as a response. Which should be
     * used to de-register it.
     */
    router.post('/registry/enter', function registrerHandler(req, res){
        res.send({
            status: true
        });
    });

    router.post('/registry/exit', function registrerHandler(req, res){
        let appId = req.body.appId;
        Application.findOne({appId}).then((result)=>{
            res.send({
                status: true
            });
        });
    });

    /**
     * List registered applications.
     */
    router.get('/application', function jobHandler(req, res) {
        Application.find().then((result)=>{
            res.send({
                status: true,
                value: result
            });
        });
    });

    router.get('/application/:id/jobs', function appJobListHandler(req, res){
        let appId = req.param.id;

        Application.findOne({appId}).populate('jobs').then((result)=>{
            res.send({
                status: true,
                value: result
            });
        });
    });

    router.post('/job', function jobCreateHandler(req, res) {
        res.send({
            status: true
        });
    });

    router.get('/job', function jobListHandler(req, res){
        res.send({
            status: true
        });
    });

    router.get('/job/:id', function jobDetailHandler(req, res) {
        Job.findOne(req.param.id).then((result)=>{
            res.send({
                status: true
            });
        });
    });



    return router;
}
