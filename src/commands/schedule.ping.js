'use strict';


function SchedulePingCommand(event){
    let context = event.context;
    let logger = context.getLogger('cmd');
    let record = event.record;

    let Check = context.models.Check;

    console.log('ping ', record.endpoint);

    let type = getTypeFromEndpoint(record.endpoint);
    let command = commandImplementation(type);

    let check = Check.initializeEmpty(record);

    command.call(context, event).then((response)=>{
        return Check.create(check);
    }).catch((err)=>{
        check.error = err;
        return Check.create(check);
    }).then(console.log);
}

module.exports = SchedulePingCommand;


function getTypeFromEndpoint(uri){
    return uri.split('://')[0];
}

function commandImplementation(type){
    return require(`./schedule.ping.${type}`);
}
