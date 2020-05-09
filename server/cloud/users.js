/* global Parse */
const cloud = require('./cloudUtils');
const { role } = require('./types');

cloud.setupFunction('set-last-activity-now', (req) => {
  const { user } = req;

  if (user) {
    user.set('lastActivity', new Date());
    user.save(null, cloud.getUserPermissions(req));
    return true;
  }
  return false;
});

cloud.setupFunction('create-user', async (req) => {
  cloud.ensureIsAdmin(req);

  const { name, email } = req.params;
  const password = `5${cloud.generateUniqueId()}a`;
  const username = cloud.generateUniqueId(20);

  const user = await Parse.User.signUp(username, password, { name, email, role: role.admin }, cloud.masterPermissions);
  return { success: true, userId: user.id };
});

cloud.setupFunction('register-user', async (req) => {

  const { name, email } = req.params;
  const password = `5${cloud.generateUniqueId()}a`;
  const username = cloud.generateUniqueId(20);

  const user = await Parse.User.signUp(username, password, { name, email, role: role.client }, cloud.masterPermissions);

  await Parse.User.requestPasswordReset(email);

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
