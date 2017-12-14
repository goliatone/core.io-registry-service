'use strict';

let count = 0;

function SchedulePingCommand(event) {
    let context = event.context;
    let logger = context.getLogger('sch-ping-cmd');
    let record = event.record;

    let Check = context.models.Check;

    logger.info('ping ', record.endpoint, ++count);

    let type = getTypeFromEndpoint(record.endpoint);
    let command = commandImplementation(type);

    let check = Check.start(record);

    command.call(context, event).then((response) => {
        logger.info('-> response %s count %s', response.statusCode, count);
        check.statusCode = response.statusCode;
        return Check.commit(null, check);
    }).catch((err) => {
        return Check.commitKo(err, check);
    }).then((check) => {
            
        logger.info('Check.commit().then: %j', check);

        let point = {
            measurement: 'probe',
            tags: {
                status: check.statusCode,
                up: check.isUp ? 1 : 0,
                responsive: check.isResponsive ? 1 : 0,
                job: check.job
            },
            fields: { 
                duration: check.responseTime,
                // ok: check.isUp ? 1 : 0,
                // res: check.isResponsive ? 1 : 0,
            },
            timestamp: check.requestTime
        };

        logger.info('Create influx point: %j', point);

        context.influx.writePoints([
            point
        ]).catch(err => {
            console.error(`Error saving data to InfluxDB! ${err.stack}`);
        });
    });
}

module.exports = SchedulePingCommand;


function getTypeFromEndpoint(uri = '') {
    return uri.split('://')[0];
}

/**
 * We should implement this!
 * The idea is that our applications 
 * can provide different kind of transports
 * to check:
 * - http
 * - https
 * - tcp
 * - websocket
 * - etc
 * 
 * @param {String} type Check type
 */
function commandImplementation(type) {
    return require(`./schedule.ping.${type}`);
}
