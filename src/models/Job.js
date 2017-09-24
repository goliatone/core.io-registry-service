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
        /*
         * Time after which an OK check
         * will be considered unresponsive.
         */
        timeoutAfter: {
            type: 'integer',
            defaultsTo: 30 * 1000
        },
        isUp: {
            type: 'boolean'
        },
        pingCount: {
            type: 'integer',
            defaultsTo: 0
        },
        notResponsiveCount: {
            type: 'integer',
            defaultsTo: 0
        },
        errorAlterThreshold: {
            type: 'integer',
            defaultsTo: 1
        },
        responseAlertThreshold: {
            type: 'integer',
            defaultsTo: 1
        },
        /*
         * time since last ping if the
         * ping is down
         */
        downtime: {
            type: 'integer'
        },
        /*
         * time since last ping if the
         * ping is up
         */
        uptime: {
            type: 'integer'
        },

        /*
         * First ping...
         */
        firstTestedAt: {
            type: 'date'
        },

        lastTestedAt: {
            type: 'date'
        },

        lastChangedAt: {
            type: 'date'
        },


        endpoint: 'string',
        name: 'string',
        description: 'string',
        label: 'string',
        /*
         * Logic to determine if we want
         * to notify of a given event
         * such as site up, down, or etc.
         */
        mustNotifyEvent: function(check){

            if(this.pingCount === 0){
                return true;
            }

            if(!check.isUp){
                /*
                 * First time job fails...
                 */
                if(this.isUp !== check.isUp){
                    this.errorCount = 1;
                }

                if(this.errorCount < this.errorAlterThreshold){
                    this.errorCount++;
                    return false;
                }

                if(this.errorCount === this.errorAlterThreshold){
                    return true;
                }

                /*
                 * We only want to trigger the unresponsive
                 * alert once per cycle.
                 */
                if(!check.isResponsive && (this.notResponsiveCount + 1) === this.responseiveAlertThreshold){
                    return true;
                }

                return false;
            }

            if(this.isUp !== check.isUp && this.errorCount > this.errorAlterThreshold){
                /*
                 * Check is up after triggering the
                 * down alert threshold
                 */
                return true;
            }

            /*
             * Service either recovered before errorAlterThreshold
             * kicked in, or is already OK
             */
            return false;
        },
        markEventNotified: function(){
            // increase error count to disable notification if the next ping has the same status
            this.errorCount = this.errorAlterThreshold + 1;
        }
    },
    createDefaultFor: function(id, options){
        if(typeof options === 'string') {
            options = {
                url: options
            };
        }

        if(!options.interval) {
            options.interval = (0.5 * 60 * 1000);
        }

        return this.create({
            application: id,
            interval: options.interval,
            endpoint: options.url
        });
    }
});

module.exports = Node;
