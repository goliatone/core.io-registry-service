'use strict';

const Scheduler = require('./lib/redis');
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
            }).then(()=>{
                console.log('rescheduled', arguments);
            });
        } else {
            scheduler.cancel({ key: 'test-key' }).then(()=>{
                console.log('canceled');
            });
        }
        console.log('test-key expired, launch job');
}});
