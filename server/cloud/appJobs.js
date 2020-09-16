/* global Parse */
const moment = require('moment');
const cloud = require('./cloudUtils');


cloud.setupJob('remove-unreferenced-resources', async () => {
  const aWeekAgo = moment().subtract(1, 'week').toDate();

  const unreferencedResources = await new Parse.Query('Resource').equalTo('refs', 0).lessThanOrEqualTo('createdAt', aWeekAgo).find(cloud.masterPermissions);
  await Parse.Object.destroyAll(unreferencedResources, cloud.masterPermissions);

  return `${unreferencedResources.length} resources were successfully garbage collected`;
});

cloud.setupJob('remove-old-job-logs', async () => {
  const aMonthAgo = moment().subtract(1, 'month').toDate();

  const jobLogs = await new Parse.Query('_JobStatus').lessThanOrEqualTo('createdAt', aMonthAgo).select().find(cloud.masterPermissions);

  await Parse.Object.destroyAll(jobLogs, cloud.masterPermissions);

  return `${jobLogs.length} job logs were cleaned up`;
});
