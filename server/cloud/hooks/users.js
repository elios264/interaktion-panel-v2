/* global Parse */
const cloud = require('../cloudUtils');
const types = require('../types');

const forbidSignupIfAuthPublic = async (req) => {
  if (req.master) {
    return;
  }

  const clientFeatures = await new Parse.Query('Config')
    .equalTo('name', 'client-features')
    .first(cloud.masterPermissions)
    .then((setting) => (setting ? JSON.parse(setting.get('value')) : {}));

  const mode = clientFeatures.authMode || types.authMode.private;

  if (!req.original && mode === types.authMode.public) {
    throw new Parse.Error(Parse.Error.OPERATION_FORBIDDEN, 'Signup deactivated');
  }
};

const forbidLoginIfAuthPublic = async (req) => {
  const clientFeatures = await new Parse.Query('Config')
    .equalTo('name', 'client-features')
    .first(cloud.masterPermissions)
    .then((setting) => (setting ? JSON.parse(setting.get('value')) : {}));

  const mode = clientFeatures.authMode || types.authMode.private;

  if (req.object.get('role') === types.role.client && mode === types.authMode.public) {
    throw new Parse.Error(Parse.Error.OPERATION_FORBIDDEN, 'Login deactivated');
  }
};

const ensureAppropriateRole = (req) => {
  switch (req.object.get('role')) {
    case types.role.admin: cloud.ensureIsAdmin(req); break;
    case types.role.client: break; // allow signup
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
  Parse.Cloud.beforeLogin(forbidLoginIfAuthPublic);
  cloud.setupTrigger('beforeSave', Parse.User, forbidSignupIfAuthPublic);
  cloud.setupTrigger('beforeSave', Parse.User, ensureAppropriateRole);
  cloud.setupTrigger('afterSave', Parse.User, assignToCorrespondingRole);
  cloud.setupTrigger('beforeDelete', Parse.User, removeSessionsAndRoles);
};

module.exports = {
  setupUsersRoleManagement,
};
