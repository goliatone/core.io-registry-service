'use strict';

const Scheduler = require('redis-scheduler');
const scheduler = new Scheduler({
    host: '192.168.99.100',
    port: 6379
});

let count = 0;

scheduler.addHandler({
    key: 'test-key',
    handler: function () {
        if(++count < 3) {
            scheduler.reschedule({
                key: 'test-key',
                expire: 1000
            }, function () {
                console.log('rescheduled');
            });
        } else {
            scheduler.cancel({ key: 'test-key' }, function () {
                console.log('canceled');
            });
        }
        console.log('test-key expired, launch job');
}});
