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
let schema = {
    identity: 'application',
    exportName: 'Application',
    connection: 'development',
    attributes: {
        id: {
            type: 'text',
            primaryKey: true,
            unique: true,
            defaultsTo: function () {
                return BaseModel.uuid();
            }
        },
        identifier: {
            type: 'text',
            unique: true,
        },
        appId: {
            type: 'string',
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
    createFromPayload: function (payload) {
        let attrs = [
            'appId',
            'hostname',
            'identifier',
            'environment'
        ];

        let values = {
            online: true
        };

        /**
         * values.appId
         * values.hostname
         * values.identifier
         * values.environment
         */
        attrs.forEach((attr) => {
            values[attr] = payload[attr];
        });

        /**
         * Everything else we store as data:
         * values.data -> ...attrs
         */
        Object.keys(payload).forEach((key) => {
            if (attrs.includes(key)) return;

            if (!values.data) {
                values.data = {};
            }
            values.data[key] = payload[key];
        });

        let criteria = {};

        if (!values.identifier) {
            values.identifier = values.appId + '@' + values.hostname;
        }

        criteria.identifier = values.identifier;

        console.log('---------------------');
        console.log('Application.updateOrCreate(%j)', criteria);
        console.log('---------------------');
        
        return this.updateOrCreate(criteria, values).then((record) => {
            /**
             * If the application specified a health 
             * endpoint, then we register a job.
             */
            if (payload.health) {
                return Job.createDefaultFor(record.id, payload.health).then(() => {
                    return record;
                });
            }
            
            return record;

        });
    }
};

let Node = BaseModel.extend(schema);

module.exports = Node;
module.exports.schema = schema;
