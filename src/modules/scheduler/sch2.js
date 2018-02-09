'use strict';

const Scheduler = require('./lib/redis');

const KEY = 'test-key';

const scheduler = new Scheduler({
    autostart: false,
    host: '192.168.99.100',
    port: 6379
});

scheduler.start().catch(err => {
    console.error(err);
    process.exit(1);
});

let count = 0;

/*
 * We are not passing any
 * expire value, which means
 * that is using whatever value
 * was used while scheduling the
 * call.
 */
scheduler
    .addHandler({
        key: KEY,
        handler,
        reschedule: true
    })
    .then(res => {
        console.log('scheduled', res);
    })
    .catch(err => {
        console.log('err', err);
    });

scheduler.addHandler({
    key: KEY,
    handler: handler2,
    repeat: 2
});

function handler(err, event) {
    console.log('handler', arguments);

    // if(++count <= 3) {
    //     console.log('reschedule', count);
    //     scheduler.reschedule({
    //         key: event.key,
    //         expire: 1000
    //     }).then(()=>{
    //         console.log('rescheduled');
    //     });
    // } else {
    //     scheduler.cancel(event.key).then(()=>{
    //         console.log('canceled');
    //     });
    // }

    console.log('test-key expired, launch job');
}

function handler2(err, event) {
    console.log('|test-key expired, launch job');
}
