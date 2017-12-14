'use strict';

const Influx = require('influx');

module.exports = {
    connection: {
        host: process.env.NODE_INFLUXDB_HOST || '192.168.99.100',
        database: process.env.NODE_INFLUXDB_DB || 'registry'
    },
    /**
     * Ideally do not store UUIDs in tags. Consider
     * moving job id to field. Add app name as tag.
     */
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