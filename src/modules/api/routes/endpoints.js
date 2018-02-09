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
module.exports = function (router, config, subapp) {

    initialize(subapp, config);

    // router.use('/', subapp);
};

function initialize(router, config) {
    // let router = express.Router();

    const context = config.context;
    const logger = context.getLogger('endpoints');

    const Job = context.models.Job;
    const Check = context.models.Check;
    const StatusEvent = context.models.StatusEvent;
    const Application = context.models.Application;

    /**
     * GET home page.
     */
    router.get('/health', function healthHandler(req, res, next) {
        res.send({
            success: true
        });
    });

    /**
     * Register a new application instance.
     * A new application get's an ID which is
     * sent back as a response. Which should be
     * used to de-register it.
     */
    router.post('/register', function registrerHandler(req, res, next) {
        let body = req.body;

        logger.info('POST /register %j', body);

        Application.createFromPayload(body).then((result = { identifier: null }) => {
            logger.info('registered app with identifier %s', result.identifier);
            res.send({
                success: true,
                value: {
                    identifier: result.identifier
                }
            });
        }).catch(next);
    });

    /**
     * Un-register an application.
     * This should be called by an application
     * after it first registerd.
     */
    router.post('/unregister', function registrerHandler(req, res, next) {
        let identifier = req.body.identifier;

        logger.info('POST /unregister %j', identifier, req.originalUrl);
        //TODO: if no identifier provided, we should try to use
        //originalUrl instead.
        Application.update({ identifier: identifier }, { online: false }).then((result) => {
            res.send({
                success: true
            });
        }).catch(next);
    });

    /**
     * List registered applications.
     */
    router.get('/application', function jobHandler(req, res, next) {
        Application.find().then((result) => {
            res.send({
                success: true,
                value: result
            });
        }).catch(next);
    });

    router.get('/application/:id/jobs', function appJobListHandler(req, res, next) {
        let appId = req.params.id;
        Job.findOne({ application: appId }).then((result) => {
            res.send({
                success: true,
                value: result
            });
        }).catch(next);
    });

    router.post('/job', function jobCreateHandler(req, res, next) {
        res.send({
            success: true
        });
    });

    router.get('/job', function jobListHandler(req, res, next) {
        Job.find().populate('application').then((result) => {
            res.send({
                success: true,
                value: result
            });
        }).catch(next);
    });

    router.get('/job/:id', function jobDetailHandler(req, res, next) {
        Job.findOne(req.params.id).then((result) => {
            res.send({
                success: true,
                value: result
            });
        });
    });

    router.get('/job/:id/checks', function jobCheckHandler(req, res, next) {
        Check.find({ job: req.params.id }).then((result) => {
            res.send({
                success: true,
                value: result
            });
        });
    });

    router.get('/check', function jobCheckCountHandler(req, res, next) {
        Check.find().then((result) => {
            res.send({
                success: true,
                value: result
            });
        });
    });
    router.get('/check/count', function jobCheckCountHandler(req, res, next) {
        Check.count().then((result) => {
            res.send({
                success: true,
                value: result
            });
        });
    });

    router.get('/job/:id/checks/count', function jobCheckCountHandler(req, res, next) {
        Check.count({ job: req.params.id }).then((result) => {
            res.send({
                success: true,
                value: result
            });
        });
    });

    router.get('/job/:id/events', function jobStatusEventHandler(req, res, next) {
        StatusEvent.find({ job: req.params.id }).then((result) => {
            res.send({
                success: true,
                value: result
            });
        });
    });

    router.get('/event', function jobStatusEventHandler(req, res, next) {
        StatusEvent.find().then((result) => {
            res.send({
                success: true,
                value: result
            });
        });
    });

    return router;
}
