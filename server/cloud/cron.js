/* global Parse */
const moment = require('moment');
const { CronJob } = require('cron');
const cloud = require('./cloudUtils');

const PARSE_TIMEZONE = 'UTC';
let cronJobs = {};

/**
 * recreate the cron schedules for a specific _JobSchedule or all _JobSchedule objects
 * @param {_JobSchedule | string} [job=null] The job schedule to recreate. If not specified, all jobs schedules will be recreated.
 * Can be a _JobSchedule object or the id of a _JobSchedule object.
 */
const recreateSchedule = async (job) => {
  if (job) {
    if (job instanceof String || typeof job === 'string') {
      const jobObject = await Parse.Object.extend('_JobSchedule').createWithoutData(job).fetch(cloud.masterPermissions);
      if (jobObject) {
        recreateJobSchedule(jobObject);
      } else {
        throw new Error(`No _JobSchedule was found with id ${job}`);
      }

    } else if (job instanceof Parse.Object && job.className === '_JobSchedule') {
      recreateJobSchedule(job);
    } else {
      throw new Error('Invalid job type. Must be a string or a _JobSchedule');
    }
  } else {
    recreateScheduleForAllJobs();
  }
};

/**
 * (Re)creates all schedules (crons) for all _JobSchedule from the Parse server
 */
const recreateScheduleForAllJobs = async () => {
  if (!Parse.applicationId) {
    throw new Error('Parse is not initialized');
  }

  const results = await new Parse.Query('_JobSchedule').find(cloud.masterPermissions);

  destroySchedules();

  for (const job of results) {
    try {
      recreateJobSchedule(job);
    } catch (error) {
      console.log(error);
    }
  }
  console.log(`${Object.keys(cronJobs).length} job(s) scheduled.`);
};

/**
 * (Re)creates the schedule (crons) of a _JobSchedule
 * @param {_JobSchedule} job The _JobSchedule
 */
const recreateJobSchedule = (job) => {
  destroySchedule(job.id);
  cronJobs[job.id] = createCronJobs(job);
};

/**
 * stop all jobs and remove them from the list of jobs
 */
const destroySchedules = () => {
  for (const key of Object.keys(cronJobs)) {
    destroySchedule(key);
  }
  cronJobs = {};
};

/**
 * destroy a planned cron job
 * @param {String} id The _JobSchedule id
 */
const destroySchedule = (id) => {
  const jobs = cronJobs[id];
  if (jobs) {
    for (const job of jobs) {
      job.stop();
    }
    delete cronJobs[id];
  }
};

const createCronJobs = (job) => {
  const startDate = new Date(job.get('startAfter'));
  const repeatMinutes = job.get('repeatMinutes');
  const jobName = job.get('jobName');
  const params = JSON.parse(job.get('params'));
  const now = moment();

  // launch just once
  if (!repeatMinutes) {
    return [
      new CronJob(
        startDate,
        () => { // on tick
          performJob(jobName, params);
        },
        null, // on complete
        true, // start
        PARSE_TIMEZONE, // timezone
      ),
    ];
  }
  // periodic job. Create a cron to launch the periodic job a the start date.
  const timeOfDay = moment(job.get('timeOfDay'), 'HH:mm:ss.Z').utc();
  const daysOfWeek = job.get('daysOfWeek');
  const cronDoW = (daysOfWeek) ? daysOfWeekToCronString(daysOfWeek) : '*';
  const minutes = repeatMinutes % 60;
  const hours = Math.floor(repeatMinutes / 60);

  let cron = '0 ';
  // minutes
  if (minutes) {
    cron += `${timeOfDay.minutes()}-59/${minutes} `;
  } else {
    cron += '0 ';
  }

  // hours
  cron += `${timeOfDay.hours()}-23`;
  if (hours) {
    cron += `/${hours}`;
  }
  cron += ' ';

  // day of month
  cron += '* ';

  // month
  cron += '* ';

  // days of week
  cron += cronDoW;

  console.log(`${jobName}: ${cron}`);

  const actualJob = new CronJob(
    cron,
    () => { // on tick
      performJob(jobName, params);
    },
    null, // on complete
    false, // start
    PARSE_TIMEZONE, // timezone
  );

  // if startDate is before now, start the cron now
  if (moment(startDate).isBefore(now)) {
    actualJob.start();
    return [actualJob];
  }

  // otherwise, schedule a cron that is going to launch our actual cron at the time of the day
  const startCron = new CronJob(
    startDate,
    () => { // on tick
      console.log('Start the cron');
      actualJob.start();
    },
    null, // on complete
    true, // start
    PARSE_TIMEZONE, // timezone
  );

  return [startCron, actualJob];
};

/**
 * converts the Parse scheduler days of week
 * @param {Array} daysOfWeek An array of seven elements for the days of the week. 1 to schedule the task for the day, otherwise 0.
 */
const daysOfWeekToCronString = (daysOfWeek) => {
  const daysNumbers = [];
  for (let i = 0; i < daysOfWeek.length; i++) {
    if (daysOfWeek[i]) {
      daysNumbers.push((i + 1) % 7);
    }
  }
  return daysNumbers.join(',');
};

/**
 * perform a background job
 * @param {String} jobName The job name on Parse Server
 * @param {Object=} params The parameters to pass to the request
 */
const performJob = (jobName, params) => {
  try {
    cloud.runCloudJob(jobName, params);
    console.log(`Job ${jobName} launched.`);
  } catch (error) {
    console.log(error);
  }
};

const init = () => {

  // recreates all crons when the server is launched
  recreateSchedule();

  // recreates schedule when a job schedule has changed
  Parse.Cloud.afterSave('_JobSchedule', (request) => {
    recreateSchedule(request.object);
  });

  // destroy schedule for removed job
  Parse.Cloud.afterDelete('_JobSchedule', (request) => {
    destroySchedule(request.object);
  });
};

init();
