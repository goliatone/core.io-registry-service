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
    start: function(record){
        return {
            requestTime: Date.now(),
            job: record.id,
            timeoutAfter: record.timeoutAfter
        };
    },
    commit: function(err, record){
        if(err) return this.commitKo(err, record);

        /*
         * This should be optional.
         * Perhaps make the check outside
         * and use the job info to know
         * if it has to fail on bogus
         * status codes.
         */
        if(record.statusCode && record.statusCode >= 400){
            return this.commitKo(new Error('Invalid response type'), record);
        }

        return this.commitOk(record);
    },
    commitKo: function(err, record){
        record.isUp = false;
        record.responseTime = Date.now() - record.requestTime;
        record.isResponsive = false;
        record.error = err.toString();
        return this.create(record);
    },
    commitOk: function(record){
        record.isUp = true;
        record.responseTime = Date.now() - record.requestTime;
        record.isResponsive = true;

        if(record.timeoutAfter){
            record.isResponsive = record.responseTime < record.timeoutAfter;
        }

        return this.create(record);
    }
});

module.exports = Node;
