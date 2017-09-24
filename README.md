## core.io Registry Service

The application registry is a development tool that enables developers to keep track of running core.io application instances.

Application instances register with the service when they boot, and optionally they could de-register when the service exits/quits.

### Documentation

#### Registration Payload
The registry exposes an API for instances to register. It also provides a way to retrieve a list of the registered applications.


Registration API:

* `POST /api/register`
* `POST /api/unregister`

* `GET  /api/application`

* `GET  /api/application/:id/jobs`

* `POST /api/job`
* `GET  /api/job`
* `GET  /api/job/:id`

##### register

A sample registration payload:

```json
{
    "appId": "my-app",
    "hostname": "goliatodromo.local",
    "data": {
        "repl": {
            "port": 8989
        },
        "server": {
            "port": 7331
        },
        "pubsub": {
            "url": "mqtt://localhost:7984"
        }
    },
    "health": {
        "url": "http://localhost:7331/health",
        "interval": 50000
    }
}
```

After a new application instance is created a default job is assigned to it.


##### unregister

#### Application vs Session

#### Jobs

##### Health
Default job that will check if the application is up. There are different strategies available like HTTP, MQTT, etc.


### Future Functionality
Error reporting, if the server is closing due to an error, it should include it in the payload, that way we can track and keep a list of errors.


Application - has-many -* Instance

https://www.npmjs.com/package/electron-mac-notifier

### TODO
- [ ] Generate an app identifier that is reproducible (hostname + appId)

## License
® License MIT 2017 by goliatone


<!--
https://github.com/Bertrand31/Monitaure
https://github.com/stefanbc/uptimey
https://github.com/qawemlilo/node-monitor
-->
