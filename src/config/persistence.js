'use strict';

module.exports = {
    moduleName: 'persistence',
    seedDB: true,
    timeout: 30 * 1000,
    orm: {
        adapters: {
            'disk': require('sails-disk')
        },
        connections: {
            development: {
                adapter: 'disk'
            },
            staging: {
                adapter: 'disk'
            }
        },
        defaults: {
            migrate: process.env.NODE_ENV === 'production' ? 'safe' : 'drop',
            connection: process.env.NODE_PERSISTENCE_CONNECTION || 'production'
        }
    }
};
