'use strict';

const BaseModel = require('core.io-persistence').BaseModel;

let Node = BaseModel.extend({
    identity: 'statusevent',
    exportName: 'StatusEvent',
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
        job: {
            model: 'job'
        },
        application: {
            model: 'application'
        },
        downtime: {
            type: 'integer'
        },
        label: 'string',
        description: 'string',
    },

});

module.exports = Node;
