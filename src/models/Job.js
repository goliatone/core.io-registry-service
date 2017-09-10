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
        active: {
            type: 'boolean',
            defaultsTo: true
        },
        application: {
            model: 'application'
        },
        name: 'string',
        description: 'string',
        label: 'string'
    }
});

module.exports = Node;
