## core.io Registry Service

The application registry is a development tool that enables developers to keep track of running core.io application instances.

Application instances register with the service when they boot, and optionally they could de-register when the service exits/quits.

### Documentation

#### Registration Payload
The registry exposes an API for instances to register. It also provides a way to retrieve a list of the registered applications.


* `POST /api/register`
* `POST /api/register/jobs`

* `GET /api/applications`
* `GET /api/applications/jobs`
* `GET /api/jobs`

##### register

A sample registration payload:

```json
{
    "appId": "my-app",
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

#### Jobs

##### Health
Default job that will check if the application is up. There are different strategies available like HTTP, MQTT, etc.


https://www.npmjs.com/package/electron-mac-notifier

## License
® License MIT by goliatone
