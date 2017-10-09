## Redis

IMPORTANT Keyspace notifications is a feature available since 2.8.0

https://redis.io/topics/notifications

Need to enable key space events:
`notify-keyspace-events Ex`

Could be configured from `redis-cli`:

```
$ redis-cli config set notify-keyspace-events Ex
```

Or using docker:

```
docker run -it --link myredis:redis --rm redis redis-cli -h redis -p 6379 
```

```
redis:6379> CONFIG set notify-keyspace-events Ex
```

```yml
FROM redis
COPY redis.conf /usr/local/etc/redis/redis.conf
CMD [ "redis-server", "/usr/local/etc/redis/redis.conf" ]
```

```
docker run -v ./ops/redis/redis.conf:/usr/local/etc/redis/redis.conf --name myredis redis redis-server /usr/local/etc/redis/redis.conf
```

```
docker run --name redis -p 6379:6379 -d redis
```


docker-compose example:

```yml
redis:
    image: redis:latest
    command: redis-server --requirepass redis
    container_name: redis
    ports: ["6379"]
```
