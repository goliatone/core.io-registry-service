'use strict';

const Influx = require('influx');

module.exports = {
    connection: {
        host: process.env.NODE_INFLUXDB_HOST || '192.168.99.100',
        database: process.env.NODE_INFLUXDB_DB || 'registry'
    },
    schema: [
        {
            measurement: 'probe',
            fields: {
              duration: Influx.FieldType.INTEGER
            },
            tags: [
                'job',
                'responsive',
                'status',
                'up'
            ]
          }
    ]
    
};