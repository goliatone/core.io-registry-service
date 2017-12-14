'use strict';

const BaseModel = require('core.io-persistence').BaseModel;
const MAX_AGE_3_MONTHS = 3 * 31 * 24 * 60 * 60 * 1000;

let schema = {
    identity: 'check',
    exportName: 'Check',
    connection: 'development',
    autoUpdatedAt: false,
    attributes: {
        id: {
            type: 'text',
            primaryKey: true,
            unique: true,
            defaultsTo: function () {
                return BaseModel.uuid();
            }
        },
        uuid: false,
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

        responseTime: {
            type: 'integer'
        },
        requestTime: {
            type: 'integer',
            defaultsTo: Date.now
        },
        /*
         * This only makes sense in
         * HTTP context.
         */
        statusCode: {
            type: 'integer'
        },
        job: {
            model: 'job'
        },
        tags: 'array',
        error: 'string',
        //TODO: This should be session
        endpoint: 'string',
    },
    start: function (record) {
        return {
            requestTime: Date.now(),
            job: record.id,
            timeoutAfter: record.timeoutAfter
        };
    },
    commit: function (err, record, codeThreshold=500) {
        if (err) return this.commitKo(err, record);

        /*
         * This should be optional.
         * Perhaps make the check outside
         * and use the job info to know
         * if it has to fail on bogus
         * status codes.
         */
        if (record.statusCode && record.statusCode >= codeThreshold) {
            return this.commitKo(new Error('Invalid response type'), record);
        }

        if(!record.statusCode) record.statusCode = 0;

        return this.commitOk(record);
    },
    commitKo: function (err, record) {
        record.isUp = false;
        record.responseTime = Date.now() - record.requestTime;
        record.isResponsive = false;
        record.error = err.toString();
        return this.create(record);
    },
    commitOk: function (record) {
        record.isUp = true;
        record.responseTime = Date.now() - record.requestTime;
        record.isResponsive = true;

        if (record.timeoutAfter) {
            record.isResponsive = record.responseTime < record.timeoutAfter;
        }

        return this.create(record);
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
