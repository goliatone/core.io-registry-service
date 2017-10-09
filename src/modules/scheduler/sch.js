'use strict';

const Scheduler = require('./lib/redis');
const scheduler = new Scheduler({
    host: '192.168.99.100',
    port: 6379
});

const expirationTime = 1000;

function eventTriggered(err, key) {
    console.log(key + ' triggered');
}

scheduler.schedule({
    key: 'test-key',
    expire: expirationTime,
    // handler: eventTriggered
}).then((key)=>{
    console.info('scheduled for %s!', key);
}).catch((err) => {
    console.error('error', err);
});
