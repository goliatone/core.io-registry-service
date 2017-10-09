'use strict';

const Scheduler = require('./lib/redis');

const KEY = 'test-key';

const scheduler = new Scheduler({
    autostart: true,
    host: '192.168.99.100',
    port: 6379
});

let count = 0;

scheduler.addHandler({
    key: KEY,
    handler
}).catch((err)=>{
    console.log('err', err);
});

function handler(err, key) {
    console.log('handler', arguments);

    if(++count < 33) {
        scheduler.reschedule({
            key,
            expire: 1000
        }).then(()=>{
            console.log('rescheduled');
        });
    } else {
        scheduler.cancel(key).then(()=>{
            console.log('canceled');
        });
    }
    console.log('test-key expired, launch job');
}
