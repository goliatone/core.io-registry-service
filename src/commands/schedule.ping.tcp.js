'use strict';

const rp = require('request-promise');


const pings = {};

function SchedulePingTcpCommand(event) {
    const context = event.context;
    const logger = context.getLogger('tcp-ping');

    const endpoint = event.record.endpoint;

    logger.info('SchedulePingHTTPCommand', endpoint);
    
    if(!pings[endpoint]) {
        pings[endpoint] = 0;
    }
    
    pings[endpoint] += 1;

    const count = pings[endpoint];

    let options = {
        uri: endpoint + `?count=${count}`,
        resolveWithFullResponse: true,
        simple: false //This return 404 as OK results
    };

    return Promise.resolve({
        statuscode: 200
    });
}

module.exports = SchedulePingTcpCommand;
