'use strict';

var BaseModel = require('core.io-persistence').BaseModel;

var Node = BaseModel.extend({
    identity: 'job',
    exportName: 'Job',
    connection: 'development',
    attributes: {
        id: {
            type: 'text',
            primaryKey: true,
            unique: true,
            defaultsTo: function() {
                return BaseModel.uuid();
            }
        },
        type: 'string',
        active: {
            type: 'boolean',
            defaultsTo: true
        },
        //TODO: This should be session
        application: {
            model: 'application'
        },
        interval: 'integer',
        /*
         * Time after which an OK check
         * will be considered unresponsive.
         */
        maxTime: {
            type: 'integer',
            defaultsTo: 30 * 1000
        },
        endpoint: 'string',
        name: 'string',
        description: 'string',
        label: 'string'
    },
    createDefaultFor: function(id, options){
        if(typeof options === 'string') {
            options = {
                url: options
            };
        }

        if(!options.interval) {
            options.interval = (0.5 * 60 * 1000);
        }

        return this.create({
            application: id,
            interval: options.interval,
            endpoint: options.url
        });
    }
});

module.exports = Node;
