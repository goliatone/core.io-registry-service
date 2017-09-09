/*jshint esversion:6, node:true*/
'use strict';

const initializeSubapp = require('core.io-express-server').initializeSubapp;

const App = require('core.io-express-server').defaultApp();

/*
 * This adaptor brings up an express subapp
 * to provide a dashboard. It relies on the
 * server module, which is the a bare bones
 * express server to which we mount different
 * sub applications.
 */
module.exports.init = initializeSubapp(App, 'api');

// module.exports.priority = -100;
