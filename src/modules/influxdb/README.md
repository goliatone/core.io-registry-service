## Original Measurement

Measurements:
* probe
* uptime

In the `probe` measurement we store response time, we use Check to track this.

In the `uptime` measurement we store changes in uptime.





## Retention Policies

We should create a retention policy for different samples:

* Default 30 days

Data down-sampling:

* Yearly (indefinite)
* Monthly (RT 52 weeks (1year))
* Weekly (RT 26 weeks (6 months))
* Daily (RT 13 weeks (4 months))
* 1 hour (RT 2 weeks)
* 1 minute (RT 1 day)

## Continuous Queries

We want to copy from different retentions to down-sample:


## Data Modeling

Fields: 
- duration
- job 
- up
- responsive

InfluxDB states that UUID's should not be tags, since tag's get indexed and that would increase memory (RAM) consumption. However, Job id's have enough points that would justify making a separate series.

You can't merge across measurements, better to keep sources mixed in single measurement and filter by tags.

## Queries

Generate the retention policy for 1m probes, hold it for 1 day:

```sql
CREATE RETENTION POLICY probe_1m ON registry DURATION 1d REPLICATION 1 DEFAULT
```

You can't perform arithmetic on tags, you can on fields. 
You have to single quote tags.

Generate the CQ:

```sql
CREATE CONTINUOUS QUERY probe_1m ON registry BEGIN
    SELECT mean("duration") AS "mean_duration", *
    INTO "1m"."downsampled_probe"
    FROM "probe"
    GROUP BY time(1m)
END
```


Application.updateOrCreate({"identifier":"auth-server@goliatorium.local"})

### Analysis

```sql
SELECT mean("duration") AS "mean_duration" FROM "probe" WHERE time < now() GROUP BY time(10m) LIMIT 10
```

Select points that are up:
```sql
SELECT * FROM "probe" WHERE "up"='1'
```

Show all the different jobs:
```sql
SHOW TAG VALUES FROM "probe" WITH KEY = "job"
```

```sql
SELECT COUNT("duration") FROM /./ WHERE time > now() - 1h GROUP BY time(10m)
```

```sql
drop database food_data
create database food_data

use food_data

SHOW RETENTION policies

CREATE RETENTION POLICY "one_hour" ON "food_data" DURATION 1h REPLICATION 1 DEFAULT
CREATE RETENTION POLICY "two_hours" ON "food_data" DURATION 2h REPLICATION 1

SHOW RETENTION policies

SHOW CONTINUOUS QUERIES
CREATE CONTINUOUS QUERY "cq_1m" ON "food_data" BEGIN SELECT mean(website) AS mean_website, mean(phone) AS mean_phone INTO food_data.two_hours.downsampled_orders FROM food_data.one_hour.orders GROUP BY time(1m), guid, host END

SHOW CONTINUOUS QUERIES

SHOW measurements

SHOW series
```

```sql
select * from two_hours.downsampled_orders limit 10
select * from one_hour.orders limit 10
```


Consider using [axibase atsd](https://github.com/axibase/atsd)