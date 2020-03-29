/* global Parse */
const cloud = require('../cloudUtils');

const assignToAdminRole = async (req) => {
  const { object: user, original: originalUser } = req;

  const isNewUser = !originalUser;
  if (!isNewUser) {
    return;
  }

  // find role
  const adminRole = await new Parse.Query(Parse.Role).equalTo('name', 'Admin').first(cloud.masterPermissions);

  // assign role
  adminRole.getUsers().add(user);

  // save changes
  await adminRole.save(null, cloud.masterPermissions);
};

const removeSessionsAndRoles = async (req) => {
  const { object: user } = req;

  const [roles, sessions] = await Promise.all([
    new Parse.Query(Parse.Role).find(cloud.masterPermissions),
    new Parse.Query(Parse.Session).equalTo('user', user).find(cloud.masterPermissions),
  ]);

  // remove from roles
  roles.forEach((role) => role.getUsers().remove(user));
  // remove sessions & save roles.
  await Promise.all([Parse.Object.saveAll(roles, cloud.masterPermissions), Parse.Object.destroyAll(sessions, cloud.masterPermissions)]);
};

const setupUsersRoleManagement = () => {
  cloud.setupTrigger('beforeSave', Parse.User, cloud.ensureIsAdmin);
  cloud.setupTrigger('afterSave', Parse.User, assignToAdminRole);
  cloud.setupTrigger('beforeDelete', Parse.User, removeSessionsAndRoles);
};

module.exports = {
  setupUsersRoleManagement,
};
