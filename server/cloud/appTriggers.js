/* global Parse */
const Joi = require('@hapi/joi').extend((joi) => ({
  type: 'string',
  base: joi.string(),
  messages: { 'json.base': 'needs to be a valid json string' },
  validate(value, helpers) {
    if (helpers.schema.$_getFlag('json')) {
      try {
        JSON.parse(value);
      } catch (err) {
        return { value, errors: helpers.error('json.base') };
      }
    }
  },
  rules: {
    json: {
      method() {
        return this.$_setFlag('json', true);
      },
    },
  },
}));

const cloud = require('./cloudUtils');
const validationsHooks = require('./hooks/validations');
const resourceHooks = require('./hooks/resources');
const usersHooks = require('./hooks/users');


const userSchema = Joi.object({
  username: Joi.string().required().max(50),
  email: Joi.string().email().max(80).required(),
  name: Joi.string().trim().max(50).required(),
  photo: Joi.object().instance(Parse.Object),
});

cloud.setupTrigger('beforeSave', Parse.User, validationsHooks.readOnly('username'));
cloud.setupTrigger('beforeSave', Parse.User, validationsHooks.validate(userSchema));
validationsHooks.setupPointerRefCountWatch({ watch: '_User.photo', counter: 'Resource.refs' });
usersHooks.setupUsersRoleManagement();

const configSchema = Joi.object({
  name: Joi.string().required().max(40),
  value: Joi.string().required().json().max(2000),
  visibility: Joi.string().max(20).default('Admin'),
});
cloud.setupTrigger('beforeSave', 'Config', validationsHooks.readOnly('name'));
cloud.setupTrigger('beforeSave', 'Config', validationsHooks.validate(configSchema));
cloud.setupTrigger('beforeSave', 'Config', validationsHooks.assignACL({ getPermission: ({ visibility }) => visibility }));

const resourceSchema = Joi.object({
  src: Joi.any().required(),
  desc: Joi.string().max(50),
  refs: Joi.number().integer().default(0),
});
cloud.setupFileWatch('Resource', ['src', 'thumbnail']);
cloud.setupTrigger('beforeSave', 'Resource', validationsHooks.readOnly({ allowMaster: true }, 'refs', 'metadata', 'thumbnail'));
cloud.setupTrigger('beforeSave', 'Resource', validationsHooks.validate(resourceSchema));
cloud.setupTrigger('beforeSave', 'Resource', resourceHooks.extractData('src', { thumbnail: 'thumbnail', metadata: ['size', 'hash'] }));

const eventLogSchema = Joi.object({
  timestamp: Joi.date().default(() => new Date()),
  userId: Joi.string().max(20).required(),
  eventName: Joi.string().max(50).required(),
  dimensions: Joi.object().required(),
});

cloud.setupTrigger('beforeSave', 'EventLog', validationsHooks.readOnly('timestamp', 'eventName', 'dimensions', 'userId'));
cloud.setupTrigger('beforeSave', 'EventLog', validationsHooks.validate(eventLogSchema));
