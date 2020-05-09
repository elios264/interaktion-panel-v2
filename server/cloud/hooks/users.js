/* global Parse */
const cloud = require('../cloudUtils');
const { role } = require('../types');

const ensureAppropriateRole = (req) => {
  switch (req.object.get('role')) {
    case role.admin: cloud.ensureIsAdmin(req); break;
    case role.client: cloud.ensureIsUser(req); break;
    default: throw new Error('Invalid role');
  }
};

const assignToCorrespondingRole = async (req) => {
  const { object: user, original: originalUser } = req;

  const isNewUser = !originalUser;
  if (!isNewUser) {
    return;
  }

  // find role
  const role = await new Parse.Query(Parse.Role).equalTo('name', user.get('role')).first(cloud.masterPermissions);

  // assign role
  role.getUsers().add(user);

  // save changes
  await role.save(null, cloud.masterPermissions);
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
  cloud.setupTrigger('beforeSave', Parse.User, ensureAppropriateRole);
  cloud.setupTrigger('afterSave', Parse.User, assignToCorrespondingRole);
  cloud.setupTrigger('beforeDelete', Parse.User, removeSessionsAndRoles);
};

module.exports = {
  setupUsersRoleManagement,
};
