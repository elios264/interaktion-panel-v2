/* global Parse */
const cloud = require('./cloudUtils');

cloud.setupJob('remove-unreferenced-resources', async () => {
  const unreferencedResources = await new Parse.Query('Resource').equalTo('refs', 0).find(cloud.masterPermissions);
  await Parse.Object.destroyAll(unreferencedResources, cloud.masterPermissions);

  return `${unreferencedResources.length} resources were successfully garbage collected`;
});
