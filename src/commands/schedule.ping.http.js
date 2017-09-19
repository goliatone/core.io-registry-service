'use strict';

const rp = require('request-promise');

function SchedulePingHTTPCommand(event){
    console.log('SchedulePingHTTPCommand', event.record.endpoint);

    let options = {
        uri: event.record.endpoint,
        resolveWithFullResponse: true,
        simple: false //This return 404 as OK results
    };

    return rp(options);
}

module.exports = SchedulePingHTTPCommand;
