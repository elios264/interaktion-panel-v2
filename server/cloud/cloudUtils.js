/* global Parse */
const _ = require('lodash');
const moment = require('moment');
const { nanoid } = require('nanoid');
const { AppCache } = require('parse-server/lib/cache');

const { role } = require('./types');

const triggerHandlers = {};

const deleteFile = async (file, silent = false) => {
  try {
    await file.destroy();
  } catch (err) {
    if (!silent) {
      throw err;
    }
  }
};
const fileWatch = (fieldNames) => (req) => {
  const { object, triggerName, original: originalObject } = req;

  for (const field of fieldNames) {
    if (triggerName === 'afterSave') {
      const fileChanged = originalObject ? _.result(object.get(field), 'name') !== _.result(originalObject.get(field), 'name') : true;
      if (fileChanged) {
        deleteFile(originalObject.get(field), true);
      }
    } else if (triggerName === 'afterDelete') {
      deleteFile(object.get(field), true);
    } else {
      throw new Parse.Error(Parse.Error.INVALID_KEY_NAME, `${triggerName} is not a valid trigger for this hook`);
    }
  }
};
const setupFileWatch = (className, fields) => {
  const fileWatcher = fileWatch(fields);
  setupTrigger('afterSave', className, fileWatcher);
  setupTrigger('afterDelete', className, fileWatcher);
};
const setupTrigger = (triggerName, className, handler) => {
  const hashName = _.isString(className) ? className : className.className;
  const handlerListId = `${triggerName}_${hashName}`;
  const handlers = triggerHandlers[handlerListId];
  const isAfterFind = triggerName === 'afterFind';

  if (handlers) {
    if (isAfterFind) {
      throw new Error('afterFind trigger can only be defined once');
    }
    handlers.push(handler);
  } else {
    triggerHandlers[handlerListId] = [handler];
    Parse.Cloud[triggerName](className, async (req) => {
      for (const curHandler of triggerHandlers[handlerListId]) {
        // eslint-disable-next-line no-await-in-loop
        const results = await curHandler(req);
        if (isAfterFind) {
          return results;
        }
      }
    });
  }
};
const setupJob = (jName, handler) => Parse.Cloud.job(jName, async (req) => {
  try {
    return await handler(req);
  } catch (err) {
    throw _.isString(err) ? err : _.get(err, 'message', _.get(err, 'responseText', 'An unknown error has ocurred'));
  }
});
const setupFunction = (fnName, handler) => Parse.Cloud.define(fnName, handler);
const runCloudJob = (jobName, params = {}) => Parse.Cloud.startJob(jobName, params);
const runCloudFunction = (functionName, params = {}) => Parse.Cloud.run(functionName, params, masterPermissions);

const httpRequestJson = async ({ method, url, body, headers = {} }) => {
  const response = await Parse.Cloud.httpRequest({ cache: 'no-cache', method, url, body, headers: { 'Content-Type': 'application/json', ...headers } });
  return _.isUndefined(response.data)
    ? { status: response.status }
    : response.data;
};

const ensureIsAdmin = (req) => {
  const isAdmin = req.master || (req.user && req.user.get('role') === role.admin) || false;
  if (!isAdmin) {
    throw new Parse.Error(Parse.Error.OPERATION_FORBIDDEN, 'Access denied');
  }
};
const ensureIsUser = (req) => {
  const isUser = req.master || req.user || false;
  if (!isUser) {
    throw new Parse.Error(Parse.Error.OPERATION_FORBIDDEN, 'Access denied');
  }
};

const ensureIsMaster = (req) => {
  if (!req.master) {
    throw new Parse.Error(Parse.Error.OPERATION_FORBIDDEN, 'Access denied');
  }
};

const setAttr = (object, props) => {
  const [prop] = _.keys(props);
  const value = props[prop];

  if (_.isNull(value)) {
    return object.unset(prop);
  }
  if (!_.isUndefined(value)) {
    return object.set(prop, value);
  }
};


const masterPermissions = { useMasterKey: true };
const getUserPermissions = (req) => ({ sessionToken: req.user.getSessionToken() });
const getValue = (value, mapping = {}, defaultValue) => _.get(mapping, [value], defaultValue);
const formatCurrency = new Intl.NumberFormat(process.env.APP_LOCALE, { style: 'currency', currency: process.env.APP_CURRENCY, minimumFractionDigits: 2 }).format;
const formatDate = (date, format = 'DD-MMM-YYYY HH:mm') => moment(date).format(format);
const getEmailAdapter = () => AppCache.cache[process.env.PARSE_APPID].value.userController.adapter;
const generateUniqueId = (length = 10) => nanoid(length);

module.exports = {
  runCloudJob,
  runCloudFunction,
  setupJob,
  setupTrigger,
  setupFunction,
  setupFileWatch,
  ensureIsAdmin,
  ensureIsUser,
  ensureIsMaster,
  masterPermissions,
  getUserPermissions,
  httpRequestJson,
  getValue,
  formatCurrency,
  setAttr,
  formatDate,
  getEmailAdapter,
  generateUniqueId,
};
