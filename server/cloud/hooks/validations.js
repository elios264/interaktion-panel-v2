/* global Parse */
const _ = require('lodash');
const cloud = require('../cloudUtils');

const validationOpts = {
  abortEarly: true, escapeHtml: true, convert: true, allowUnknown: true,
};

const validate = (schema) => (req) => {
  const { object } = req;
  const { error, value: newObj } = schema.validate(_.clone(object.attributes), validationOpts);

  if (error) {
    throw new Parse.Error(Parse.Error.VALIDATION_ERROR, error.message);
  } else {
    const setProps = _.pickBy(newObj, (value, key) => ((_.isUndefined(value) || value instanceof Parse.Relation) ? false : object.get(key) !== value));
    const unsetProps = _.difference(_.keys(object.attributes), _.keys(newObj));
    object.set(setProps);
    _.each(unsetProps, (prop) => object.unset(prop));
  }
};
const readOnly = (options, ...fieldNames) => (req) => {
  const { object, master } = req;

  if (_.isString(options)) {
    fieldNames = [options, ...fieldNames];
    options = {};
  }

  const { allowMaster = false } = options;

  if (master && allowMaster) {
    return;
  }

  if (!object.isNew()) {
    const modifiedFields = _.intersection(object.dirtyKeys(), fieldNames);

    if (modifiedFields.length) {
      throw new Parse.Error(Parse.Error.OPERATION_FORBIDDEN, `The following fields are readonly: [${modifiedFields.join(', ')}]`);
    }
  }
};
const cascadeDelete = ({ query }) => async (req) => {
  let [target, prop] = _.split(query, '.');
  if (prop === undefined) {
    [prop, target] = [target, prop];
  }

  const objectsToDelete = await (target
    ? new Parse.Query(target).select([]).equalTo(prop, req.object).find(cloud.masterPermissions)
    : _.castArray(req.object.get(prop)));

  await Parse.Object.destroyAll(_.flatten(objectsToDelete), cloud.masterPermissions);
};

const assignACL = ({ getPermission }) => (req) => {
  const { object } = req;

  const permission = _.uniq(_.castArray(getPermission(object.attributes, object)));
  const acl = new Parse.ACL();

  _.each(permission, (perm) => {

    let [access, role] = _.split(perm, ':');
    if (role === undefined) {
      [access, role] = ['*', access];
    }

    const shouldRead = _.includes(['read', '*'], access);
    const shouldWrite = _.includes(['write', '*'], access);

    if (role === '*') {
      if (shouldRead) {
        acl.setPublicReadAccess(true);
      }
      if (shouldWrite) {
        acl.setPublicWriteAccess(true);
      }
    } else {
      if (shouldRead) {
        acl.setRoleReadAccess(role, true);
      }
      if (shouldWrite) {
        acl.setRoleWriteAccess(role, true);
      }
    }
  });

  object.setACL(acl);
};
const pointerRefCountWatch = (counter, fieldsToWatch) => async (req) => {
  let { object, triggerName, original: originalObject } = req;
  const [className, fieldName] = _.split(counter, '.');

  if (triggerName === 'afterDelete') {
    originalObject = object;
    object = undefined;
  } else if (triggerName !== 'afterSave') {
    throw new Parse.Error(Parse.Error.INVALID_KEY_NAME, `${triggerName} is not a valid trigger for this hook`);
  }

  await Promise.all(_.map(fieldsToWatch, async (field) => {
    [, field] = _.split(field, '.');
    let oldReferences = originalObject && originalObject.get(field);
    let newReferences = object && object.get(field);

    oldReferences = _.map(_.isArray(oldReferences) ? oldReferences : (_.isNil(oldReferences) ? [] : [{ id: oldReferences.id }]), 'id');
    newReferences = _.map(_.isArray(newReferences) ? newReferences : (_.isNil(newReferences) ? [] : [{ id: newReferences.id }]), 'id');

    let removedReferences = _.difference(oldReferences, newReferences);
    let addedReferences = _.difference(newReferences, oldReferences);

    removedReferences = _(removedReferences).map((objectId) => new Parse.Object(className, ({ objectId })).increment(fieldName, -1)).value();
    addedReferences = _(addedReferences).map((objectId) => new Parse.Object(className, ({ objectId })).increment(fieldName, 1)).value();

    await Parse.Object.saveAll([...removedReferences, ...addedReferences], cloud.masterPermissions).catch(console.log);
  }));
};
const setupPointerRefCountWatch = ({ watch, counter }) => {
  watch = _.castArray(watch);

  const [counterClassName] = _.split(counter, '.');
  const [watchClassName] = _.split(watch[0], '.');

  if (counterClassName === watchClassName) {
    throw new Error('same target is not supported');
  }

  if (_.some(watch, (cls) => _.split(cls, '.')[0] !== watchClassName)) {
    throw new Error('different classNames are not supported');
  }

  const pointerRefCountWatcher = pointerRefCountWatch(counter, watch);
  cloud.setupTrigger('afterSave', watchClassName, pointerRefCountWatcher);
  cloud.setupTrigger('afterDelete', watchClassName, pointerRefCountWatcher);
};

module.exports = {
  readOnly,
  validate,
  cascadeDelete,
  assignACL,
  setupPointerRefCountWatch,
};
