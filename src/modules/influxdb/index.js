'use strict';

const Influx = require('influx');

module.exports.init = function(context, config) {
    
    let schema = config.schema;
    let {host, database} = config.connection;

    const logger = context.getLogger('influx');

    const influx = new Influx.InfluxDB({
        host,
        database,
        schema
    });

    influx.getDatabaseNames()
        .then(names => {
            if (!names.includes(database)) {
                return influx.createDatabase(database);
            }
    }).then(() => {
        logger.info(`Influx database created!`);
        context.provide('influx', influx);
    }).catch(err => {
        logger.error(`Error creating Influx database!`);
    });
};