'use strict';

module.exports = {
    clientid: 'registry-service',
    url: process.env.NODE_MQTT_ENDPOINT || 'mqtt://localhost:1883',
    onconnect: {
        topic: 'ww/registry/service/up'
    },
    transport: {
        will: {
            topic: 'ww/registry/service/down'
        }
    },
    handlers: {
        'ww/registry/register': console.log,
        'ww/registry/unregister': console.log,
        'ww/registry/list': function(topic, event){
            let context = this;
            let Application = context.models.Application;
            Application.find().then((result)=> {
                console.log('send result to ', event.respondTo, result);
                if(event.response){
                    console.log('sending response...');
                    event.response({result});
                }
                // context.pubsub.publish(event.respondTo, {result});
            }).catch(console.error);
        },
    }
};
