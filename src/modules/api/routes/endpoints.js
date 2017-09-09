/*jshint esversion:6, node:true*/
'use strict';

const express = require('express');

module.exports = function(app, config){
    var router = initialize(app, config);

    app.use('/', router);
};

function initialize(app, config){
    var router = express.Router();

    /**
     * GET home page.
     */
    router.get('/health', function healthHandler(req, res, next) {
        res.send({
            status: true
        });
    });

    return router;
}
