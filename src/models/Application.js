'use strict';

const BaseModel = require('core.io-persistence').BaseModel;

/*
 * We should have a model for an Application
 * and then have a separate AppSession model.
 */
let Node = BaseModel.extend({
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
        appId: {
            type:'string',
            index: true
        },
        hostname: 'string',
        environment: {
            type: 'string'
        },

        online: {
            type: 'boolean',
            defaultsTo: false
        },

        jobs: {
            collection: 'job',
            via: 'application'
        },

        data: 'json',

        label: 'string',
        description: 'string',
    },
    createFromPayload: function(payload) {
        let attrs = ['appId', 'hostname', 'environment'];

        let criteria = {
            online: true
        };

        attrs.forEach((attr)=>{
            criteria[attr] = payload[attr];
        });

        Object.keys(payload).forEach((key)=>{
            if(attrs.includes(key)) return;

            if(!criteria.data) {
                criteria.data = {};
            }
            criteria.data[key] = payload[key];
        });

        return this.create(criteria);
    }
});

module.exports = Node;
