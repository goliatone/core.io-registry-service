'use strict';

const rp = require('request-promise');

function SchedulePingHTTPCommand(event){
    console.log('SchedulePingHTTPCommand', event.record.endpoint);

    return rp(event.record.endpoint);
}

module.exports = SchedulePingHTTPCommand;
