'use strict';

const BaseModel = require('core.io-persistence').BaseModel;

/*
 * TODO: We should have a model for an Application
 * and then have a separate AppSession model.
 *
 * Possibly break this into Application and
 * ApplicationInstance.
 *
 * Need to find a way to get a unique identifier
 * for each instance, so that we don't create
 * multiple instances.
 *
 * If we run multiple instances of the same
 * app on a single machine they must have a
 * different port (?)
 *
 * If we run an application in different machines
 * but same port.
 *
 * If we change the environment should it be a
 * different instance?
 * appId + machine + port
 *
 *
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

        healthUrl: 'string',
        healthInterval: 'integer',

        label: 'string',
        description: 'string',
    },
    createFromPayload: function(payload) {
        let attrs = [
            'appId',
            'hostname',
            'environment'
        ];

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
        //TODO: REMOVE!!!
        //DEBUG DEVELOPMENT
        console.warn('-------------- DEVELOPMENT ---------');
        console.warn('REMOVE THIS!!!!');
        console.warn('WE CREATED A DUMMY URL');
        payload.health = {
            url: 'http://localhost:7331/api/health'
        }

        return this.create(criteria).then((record)=>{
            if(payload.health) {
                return Job.createDefaultFor(record.id, payload.health).then(()=>{
                    return record;
                });
            }
            return record;

        });
    }
});

module.exports = Node;
