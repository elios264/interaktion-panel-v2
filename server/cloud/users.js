/* global Parse */
const _ = require('lodash');
const cloud = require('./cloudUtils');
const { role } = require('./types');

cloud.setupFunction('set-last-activity-now', (req) => {
  const { user, params } = req;

  if (user) {
    user.set('lastActivity', new Date());
    if (params.language) {
      user.set('language', params.language);
    }
    user.save(null, cloud.getUserPermissions(req));
    return true;
  }
  return false;
});

cloud.setupFunction('create-manager', async (req) => {
  cloud.ensureIsAdmin(req);

  const { name, email } = req.params;
  const password = `5${cloud.generateUniqueId()}a`;
  const username = cloud.generateUniqueId(20);

  const user = await Parse.User.signUp(username, password, { name, email, role: role.admin }, cloud.masterPermissions);

  await Parse.User.requestPasswordReset(email);

  return { success: true, userId: user.id };
});

cloud.setupFunction('create-user', async (req) => {
  if (req.user) {
    cloud.ensureIsAdmin(req);
  }

  const { name, email, language } = req.params;
  const password = `5${cloud.generateUniqueId()}a`;
  const username = cloud.generateUniqueId(20);

  const user = await Parse.User.signUp(username, password, { name, email, role: role.client, language }, req.user ? cloud.masterPermissions : {});

  await Parse.User.requestPasswordReset(email);

  return { success: true, userId: user.id };
});

cloud.setupFunction('update-user', async (req) => {
  cloud.ensureIsAdmin(req);

  const { user: userJson, fields } = req.params;
  const user = Parse.Object.fromJSON(userJson);

  _.each(fields, (field) => user.set(field, user.get(field))); // make them dirty again

  await user.save(null, cloud.masterPermissions);

  return { success: true, userId: user.id };
});

cloud.setupFunction('delete-user', async (req) => {
  cloud.ensureIsAdmin(req);

  const { id } = req.params;
  const userToDelete = await new Parse.Query(Parse.User).equalTo('objectId', id).first(cloud.masterPermissions);

  if (!userToDelete) {
    throw new Parse.Error(Parse.Error.OBJECT_NOT_FOUND, 'User not found');
  }

  if (userToDelete.id === req.user.id) {
    throw new Parse.Error(Parse.Error.OTHER_CAUSE, 'You cannot delete your own user');
  }

  await userToDelete.destroy(cloud.masterPermissions);
  return true;
});
