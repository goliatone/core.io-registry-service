'use strict';

const Scheduler = require('./lib/redis');

const KEY = 'test-key';

const scheduler = new Scheduler({
    autostart: true,
    host: '192.168.99.100',
    port: 6379
});

let count = 0;

/*
 * We are not passing any
 * expire value, which means
 * that is using whatever value
 * was used while scheduling the
 * call.
 */
scheduler.addHandler({
    key: KEY,
    handler
}).then((res)=>{
    console.log('scheduled', res);
}).catch((err)=>{
    console.log('err', err);
});

function handler(err, event) {
    console.log('handler', arguments);
    console.log('test-key expired, launch job');
}
