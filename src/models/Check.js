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
        endpoint: 'string',
        name: 'string',
        description: 'string',
        label: 'string'
    }
});

module.exports = Node;
