'use strict';

const Scheduler = require('./lib/redis');

const KEY = 'test-key';

const expirationTime = 1000;

const scheduler = new Scheduler({
    autostart: false,
    host: '192.168.99.100',
    port: 6379
});

scheduler.start().catch((err)=>{
    console.error(err);
    process.exit(1);
});

function eventTriggered(err, task) {
    console.log('triggered', task);
}

scheduler.schedule({
    key: KEY,
    expire: expirationTime,
    reschedule: true
}).then((task) => {
    console.info('scheduled for %j!', task);
}).catch((err) => {
    console.error('error', err);
});

scheduler.addHandler({
    key: KEY,
    handler: eventTriggered,
    reschedule: 6
});
