'use strict';

module.exports = {
    logger: console,
    autoinitialize: true,
    strategy: 'native',
    interval: 10000,
    strategyMap: {
        redis: require('./redis'),
        native: require('./native')
    },
    options: {}
};
