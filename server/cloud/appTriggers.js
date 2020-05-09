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

cloud.setupTrigger('beforeSave', Parse.User, validationsHooks.readOnly('username', 'role'));
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
  active: Joi.boolean().default(true),
  title: Joi.object({ us: Joi.string().trim().max(200).required() }).pattern(/.*/, Joi.string().trim().max(200)).required(),
  description: Joi.object({ us: Joi.string().trim().max(2000).required() }).pattern(/.*/, Joi.string().trim().max(2000)).required(),
  image: Joi.object().type(Parse.Object).required(),
  mobileView: Joi.string().valid(..._.values(mobileView)).required(),
  refs: Joi.number().default(0),
});
cloud.setupTrigger('beforeSave', 'ContentDefinition', validationsHooks.validate(contentDefinitionSchema));
cloud.setupTrigger('beforeSave', 'ContentDefinition', validationsHooks.readOnly({ allowMaster: true }, 'refs'));
cloud.setupTrigger('beforeSave', 'ContentDefinition', validationsHooks.assignACL({ getPermission: ({ active }) => active ? '*' : 'Admin' }));
cloud.setupTrigger('afterDelete', 'ContentDefinition', validationsHooks.cascadeDelete({ query: 'Content.definition' }));
validationsHooks.setupPointerRefCountWatch({ watch: 'ContentDefinition.image', counter: 'Resource.refs' });

const documentSchema = Joi.object({
  title: Joi.string().trim().required().max(100),
  description: Joi.string().trim().required().max(400),
  content: Joi.string().required(),
  contentResources: Joi.array().items(Joi.object().type(Parse.Object)).max(50),
  language: Joi.string().max(5).default(process.env.APP_LOCALE),
});
cloud.setupTrigger('beforeSave', 'Document', validationsHooks.validate(documentSchema));
cloud.setupTrigger('beforeSave', 'Document', validationsHooks.readOnly({ allowMaster: true }, 'refs'));
validationsHooks.setupPointerRefCountWatch({ watch: 'Document.contentResources', counter: 'Resource.refs' });

const contentSchema = Joi.object({
  definition: Joi.object().type(Parse.Object).required(),
  visibility: Joi.string().max(20).default(visibility.none),
  contents: Joi.array().items(Joi.object().type(Parse.Object)).max(50),
  entityType: Joi.string().valid(..._.values(contentType)).required(),
  entityInfo: Joi.object().required(),
});

cloud.setupTrigger('beforeSave', 'Content', validationsHooks.validate(contentSchema));
cloud.setupTrigger('beforeSave', 'Content', validationsHooks.assignACL({ getPermission: ({ visibility }) => visibility }));
cloud.setupTrigger('afterDelete', 'Content', validationsHooks.cascadeDelete({ query: 'contents' }));
validationsHooks.setupPointerRefCountWatch({ watch: 'Content.definition', counter: 'ContentDefinition.refs' });
