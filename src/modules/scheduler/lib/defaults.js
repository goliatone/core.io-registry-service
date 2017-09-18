'use strict';


module.exports = {
    strategy: 'native',
    interval: 10000,
    strategyMap: {
        redis: require('./redis'),
        native: require('./native'),
    },
    options: {}
};
