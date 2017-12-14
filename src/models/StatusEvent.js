'use strict';

const BaseModel = require('core.io-persistence').BaseModel;
const MAX_AGE_3_MONTHS = 3 * 31 * 24 * 60 * 60 * 1000;

let schema = {
    identity: 'statusevent',
    exportName: 'StatusEvent',
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
    purge: function (maxAge = MAX_AGE_3_MONTHS) {
        const oldestDateToKeep = new Date(Date.now() - maxAge);
        return this.destroy({
            createdAt: {
                '<': oldestDateToKeep
            }
        });
    }
};

let Node = BaseModel.extend(schema);

module.exports = Node;
module.exports.schema = schema;
