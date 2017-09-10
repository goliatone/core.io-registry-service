'use strict';

var BaseModel = require('core.io-persistence').BaseModel;

var Node = BaseModel.extend({
    identity: 'application',
    exportName: 'Application',
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
        online: {
            type: 'boolean',
            defaultsTo: false
        },
        appId: {
            type:'string',
            index: true
        },
        hostname: 'string',
        jobs: {
            collection: 'job',
            via: 'application'
        },
        data: 'json',
        description: 'string',
        label: 'string'
    },
    createFromPayload: function(payload){
        
    }
});

module.exports = Node;
