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

const _ = require('lodash');
const cloud = require('./cloudUtils');
const validationsHooks = require('./hooks/validations');
const resourceHooks = require('./hooks/resources');
const usersHooks = require('./hooks/users');
const { role, mobileView, contentType, visibility } = require('./types');


const userSchema = Joi.object({
  username: Joi.string().required().max(50),
  email: Joi.string().email().max(80).required(),
  name: Joi.string().trim().max(50).required(),
  photo: Joi.object().instance(Parse.Object),
  role: Joi.string().valid(..._.values(role)).required(),
});

cloud.setupTrigger('beforeSave', Parse.User, validationsHooks.readOnly({ allowMaster: true }, 'username', 'role'));
cloud.setupTrigger('beforeSave', Parse.User, validationsHooks.validate(userSchema));
validationsHooks.setupPointerRefCountWatch({ watch: '_User.photo', counter: 'Resource.refs' });
usersHooks.setupUsersRoleManagement();

const configSchema = Joi.object({
  name: Joi.string().required().max(40),
  value: Joi.string().required().json().max(2000),
  visibility: Joi.string().max(20).default(visibility.none),
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

const contentDefinitionSchema = Joi.object({
  enabled: Joi.boolean().default(true),
  title: Joi.object({ [process.env.APP_LOCALE]: Joi.string().trim().max(200).required() }).pattern(/.*/, Joi.string().trim().max(200)).required(),
  description: Joi.object({ [process.env.APP_LOCALE]: Joi.string().trim().max(2000).required() }).pattern(/.*/, Joi.string().trim().max(2000)).required(),
  image: Joi.object().instance(Parse.Object).required(),
  mobileView: Joi.string().valid(..._.values(mobileView)).required(),
  refs: Joi.number().default(0),
});
cloud.setupTrigger('beforeSave', 'ContentDefinition', validationsHooks.validate(contentDefinitionSchema));
cloud.setupTrigger('beforeSave', 'ContentDefinition', validationsHooks.readOnly({ allowMaster: true }, 'refs'));
cloud.setupTrigger('beforeSave', 'ContentDefinition', validationsHooks.assignACL({ getPermission: ({ enabled }) => enabled ? '*' : 'Admin' }));
cloud.setupTrigger('afterDelete', 'ContentDefinition', validationsHooks.cascadeDelete({ query: 'Content.definition' }));
validationsHooks.setupPointerRefCountWatch({ watch: 'ContentDefinition.image', counter: 'Resource.refs' });

const contentSchema = Joi.object({
  definition: Joi.object().instance(Parse.Object).required(),
  visibility: Joi.string().valid(..._.values(visibility)).default(visibility.none),
  image: Joi.object().instance(Parse.Object).required(),
  entityType: Joi.string().valid(..._.values(contentType)).required(),
  entityInfo: Joi.any().when('entityType', { is: contentType.content, then: Joi.object().strip(), otherwise: Joi.object().required() }),
  title: Joi.object({ [process.env.APP_LOCALE]: Joi.string().trim().max(200).required() }).pattern(/.*/, Joi.string().trim().max(200)).required(),
  description: Joi.object({ [process.env.APP_LOCALE]: Joi.string().trim().max(2000).required() }).pattern(/.*/, Joi.string().trim().max(2000)).required(),
  contents: Joi.object({ [process.env.APP_LOCALE]: Joi.array().items(Joi.object()).required() }).pattern(/.*/, Joi.array().items(Joi.object())).required(),
  contentsResources: Joi.array().items(Joi.object().instance(Parse.Object)).max(50),
});

cloud.setupTrigger('beforeSave', 'Content', validationsHooks.validate(contentSchema));
cloud.setupTrigger('beforeSave', 'Content', validationsHooks.assignACL({ getPermission: ({ visibility }) => visibility }));
cloud.setupTrigger('afterDelete', 'Content', validationsHooks.cascadeDelete({ query: 'contents' }));
validationsHooks.setupPointerRefCountWatch({ watch: 'Content.definition', counter: 'ContentDefinition.refs' });
validationsHooks.setupPointerRefCountWatch({ watch: 'Content.image', counter: 'Resource.refs' });
validationsHooks.setupPointerRefCountWatch({ watch: 'Content.contentsResources', counter: 'Resource.refs' });
