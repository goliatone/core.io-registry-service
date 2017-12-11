'use strict';

/*
 * This is where the actual monitoring
 * happens...
 */
function OnCheckCommand(event) {
    const context = event.context;
    const logger = context.getLogger('check-cmd');

    logger.info('check command on %s', event.action);

    let check = event.record;

    const Job = context.models.Job;
    const StatusEvent = context.models.StatusEvent;

    Job.findOne({ id: check.job }).then((job) => {
        let promises = [];
        let now = new Date();

        const mustNotifyEvent = job.mustNotifyEvent(check);

        if (job.pingCount === 0) {
            //this is createdAt
            this.firstTestedAt = now;
        }

        //this is updatedAt
        job.lastTestedAt = now;

        /*
         * This is a transition...
         */
        if (job.isUp !== check.isUp) {
            job.lastChangedAt = now;
            job.isUp = check.isUp;
            job.uptime = 0;
            job.downtime = 0;
        }

        if (check.isResponsive) {
            job.notResponsiveCount = 0;
        } else {
            job.notResponsiveCount++;
        }

        if (mustNotifyEvent) {
            let notice = {
                job: job.id,
                application: job.application,
                // tags: job.tags,
                label: check.isUp ? 'up' : 'down',
                description: check.error
            };

            if (check.isUp && job.lastChangedAt && job.pingCount > 0) {
                /*
                 * Service comes back up
                 */
                event.downtime = now.getTime() - job.lastChangedAt.getTime();
            }

            promises.push(StatusEvent.create(notice));

            job.markEventNotified();
        }

        let timeSinceLastChange = now.getTime() - job.lastChangedAt.getTime();

        if (check.isUp) {
            job.uptime = timeSinceLastChange;
        } else {
            job.downtime = timeSinceLastChange;
        }

        ++job.pingCount;

        promises.push(job.save());

        return Promise.all(promises).then(() => {
            logger.info('job updated...');
        });

    }).catch(logger.error);
}

module.exports = OnCheckCommand;
