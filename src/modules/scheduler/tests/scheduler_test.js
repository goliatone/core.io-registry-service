'use strict';
const EventEmitter = require('events');
const Scheduler = require('..');


const coreio = new EventEmitter();

coreio.getLogger = function() {
    return console;
};

coreio.provide = function(id, instance) {
    this[id] = instance;
    this.emit('scheduler.ready');
};

console.getLogger = coreio.getLogger;

Scheduler.init(coreio, {
    strategy: 'redis',
    autostart: true,
    options: {
        host: '192.168.99.100',
        port: 6379
    }
});

coreio.on('scheduler.ready', () => {
    coreio.scheduler.schedule({
        key: 'test-key',
        expire: 5000,
        reschedule: true
    }).then((task) => {
        console.info('schedule for %j', task);
    }).catch((err)=>{
        console.error('Error', err);
    });

    coreio.scheduler.on('schedule.event', (e) => {
        console.log('Event:', e);
    });
});

