'use strict';

const Scheduler = require('./lib/redis');

const KEY = 'test-key';
const expirationTime = 1000;

const scheduler = new Scheduler({
    autostart: true,
    host: '192.168.99.100',
    port: 6379
});

function eventTriggered(err, task) {
    console.log('triggered', task);
}

scheduler.schedule({
    key: KEY,
    expire: expirationTime,
    handler: eventTriggered
}).then((task)=>{
    console.info('scheduled for %j!', task);
}).catch((err) => {
    console.error('error', err);
});
