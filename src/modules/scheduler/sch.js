'use strict';

const Scheduler = require('redis-scheduler');
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
    handler: eventTriggered
}, function (err) {
    if(err) console.error('error', err);
    else console.info('scheduled!');
});
