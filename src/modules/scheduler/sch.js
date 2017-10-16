'use strict';

const Scheduler = require('./lib/redis');

const KEY = 'test-key';
const expirationTime = 1000;

const scheduler = new Scheduler({
    autostart: true,
    host: '192.168.99.100',
    port: 6379
});

function eventTriggered(err, key) {
    console.log(key + ' triggered');
}

scheduler.schedule({
    key: KEY,
    expire: expirationTime,
    // handler: eventTriggered
}).then((key)=>{
    console.info('scheduled for %s!', key);
}).catch((err) => {
    console.error('error', err);
});
