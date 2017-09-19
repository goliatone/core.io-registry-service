'use strict';

var BaseModel = require('core.io-persistence').BaseModel;

var Node = BaseModel.extend({
    identity: 'check',
    exportName: 'Check',
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
        timestamp: {
            type: 'integer',
            defaultsTo: Date.now
        },
        /*
         * false if ping returned a non-OK
         * status code or timed out
         */
        isUp: {
            type: 'boolean',
            defaultsTo: false
        },
        /*
         * true if the ping time is less
         * than the check max time
         */
        isResponsive: {
            type: 'boolean',
            defaultsTo: false
        },

        time: 'number',
        job: {
            model: 'job'
        },
        tags: 'array',
        /*
         * time since last ping if the
         * ping is down
         */
        downtime: 'number',
        error: 'string',
        //TODO: This should be session
        application: {
            model: 'application'
        },
        endpoint: 'string',
    },
    initializeEmpty: function(record){
        return {
            timestamp: Date.now(),
            record: record.id
        };
    }
});

module.exports = Node;
