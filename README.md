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

NOTE: If you have an application registered, but there are no jobs present, check that your redis is properly configured.

##### Health
Default job that will check if the application is up. There are different strategies available like HTTP, MQTT, etc.


### Future Functionality
Error reporting, if the server is closing due to an error, it should include it in the payload, that way we can track and keep a list of errors.


Application - has-many -* Instance

https://www.npmjs.com/package/electron-mac-notifier


## Docker 

### Redis 

Run locally:

```bash
docker run -d \
    -v ./ops/redis/redis.conf:/etc/redis.conf \
    -p 6379:6379 \
    --name=redis \
    redis
```

```bash
docker run --rm --link=redis -it redis redis -host redis
```


### InfluxDB

Read more about InfluxDB docker image [here](https://hub.docker.com/_/influxdb/).
Read about the Node.js client [here](https://node-influx.github.io/).
Read InfluxDB documentation [here](https://docs.influxdata.com/influxdb/v1.3/introduction/getting_started/).
Development: 

```
docker run -p 8086:8086 -p 8083:8083 \
      -v $PWD/ops/influxdb/data:/var/lib/influxdb \
      -v $PWD/ops/influxdb/influxdb.conf:/etc/influxdb/influxdb.conf:ro \
      -d --restart=always \
      -e INFLUXDB_ADMIN_ENABLED=true \
      -e INFLUXDB_DB=registry \
      --name=influxdb \
      influxdb -config /etc/influxdb/influxdb.conf
```

CLI client:

```bash
docker run --rm --link=influxdb -it influxdb influx -host influxdb
```

Initialize:

```js
> CREATE DATABASE registry
```


```json
{
    "id": "706d6260-e426-4e7c-9546-ddf38a3271ef",
    "job": "83da337f-e8cf-4ffc-b1b0-e3fe2237e0d2",
    "requestTime": 1512950873067,
    "timeoutAfter": 30000,
    "statusCode": 200,
    "isUp": true,
    "responseTime": 34,
    "isResponsive": true,
    "createdAt": "2017-12-11T00:07:53.107Z"
}
```

Line Protocol:

```
payment,device=mobile,product=Notepad,method=credit billed=33,licenses=3i 1434067467100293230
```

```
probe,job=83da337f-e8cf-4ffc-b1b0-e3fe2237e0d2,status=1,responsive=1,up=1 response=34 1512950873067
```


### TODO
- [ ] Generate an app identifier that is reproducible (hostname + appId)
- [ ] Implement scheduler
- [ ] Implement background jobs
- [ ] Implement stats

## License
® License MIT 2017 by goliatone


<!--
https://github.com/Bertrand31/Monitaure
https://github.com/stefanbc/uptimey
https://github.com/qawemlilo/node-monitor
-->
