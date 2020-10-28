import _ from 'lodash';
import Parse from 'parse';

import { debounceCall } from 'controls/utils';
import { User, BaseObject } from 'objects';
import { buildQuery, handleOperation } from 'utils/api';
import { AnalyticsProvider } from './analyticsProvider';

export class Api {

  constructor() {
    Parse.initialize(window.__ENVIRONMENT__.PARSE_APPID);
    Parse.serverURL = `${window.__ENVIRONMENT__.APP_URL}${window.__ENVIRONMENT__.PARSE_PATH}`;
  }

  realTimeSubs = [];

  onEvent = () => console.error('Call initialize with onEventCallback first');

  async initialize({ dispatch, getState }) {
    this.onEvent = dispatch;
    this.analytics = new AnalyticsProvider({ dispatch, getState });

    let user = await Parse.User.currentAsync();

    try {
      user = await user.fetch();
    } catch (err) {
      user = null;
    }

    if (user) {
      this.initializeRealTime();
      this.onEvent({ type: 'SET_USER', user });
      Parse.Cloud.run('set-last-activity-now');
    }

    return user;
  }

  async initializeRealTime() {
    if (process.env.NODE_ENV !== 'production') {
      console.log('Initializing real time');
    }

    if (this.realTimeSubs.length) {
      throw new Parse.Error(Parse.Error.COMMAND_UNAVAILABLE, 'Real time has already been initialized');
    }

    const realTimeQueries = [
      buildQuery('_User'),
      buildQuery('Config'),
      buildQuery('Resource'),
      buildQuery('EventLog'),
      buildQuery('ContentDefinition'),
      buildQuery('Content'),
      buildQuery('Page'),
    ];

    this.realTimeSubs = await Promise.all(realTimeQueries.map(async (query) => {
      const name = query.className;
      const subscription = await query.subscribe();

      subscription.on('create', debounceCall((objects) => this.onEvent({ type: `${name}_ADDED`, objects }), 500));
      subscription.on('update', debounceCall((objects) => this.onEvent({ type: `${name}_UPDATED`, objects }), 500));
      subscription.on('delete', debounceCall((objects) => this.onEvent({ type: `${name}_REMOVED`, objects }), 500));

      return subscription;
    }));
  }

  terminateRealTime = () => {
    if (process.env.NODE_ENV !== 'production') {
      console.log('Terminating real time');
    }
    this.realTimeSubs.forEach((s) => {
      s.removeAllListeners('create'); s.removeAllListeners('update'); s.removeAllListeners('delete');
    });
    this.realTimeSubs = [];
  }

  login = ({ email, password }) => handleOperation(async () => {
    if (Parse.User.current()) {
      Parse.User.logOut();
    }

    let user = await Parse.User.logIn(email, password);
    user = BaseObject.copy(user);

    if (user.role !== User.role.admin) {
      Parse.User.logOut();
      throw new Error('Invalid role');
    }

    this.initializeRealTime();

    this.onEvent({ type: 'SET_USER', user });
    return user;
  }, this, 'Logging in', { login: true })

  logout() {
    this.terminateRealTime();
    Parse.User.logOut();
    this.onEvent({ type: 'SET_USER', user: null });
  }

  updateProfile = (user) => handleOperation(async () => {
    if (user instanceof User) {
      await user.save();
    } else {
      await Parse.User.current().save(user);
      await Parse.User.current().fetch();
    }
    return true;
  }, this, 'Updating profile')

  updateUser = (user) => handleOperation(async () => {

    if (user.photo && user.dirty('photo') && !user.photo.id) {
      await user.photo.save();
    }
    await Parse.Cloud.run('update-user', { user: BaseObject.toFullJSON(user), fields: user.dirtyKeys() });

  }, this, 'Updating user');

  createManager = ({ email, name }) => handleOperation(() => Parse.Cloud.run('create-manager', { name, email }), this, 'Creating manager')

  createUser = ({ email, name }) => handleOperation(() => Parse.Cloud.run('create-user', { name, email }), this, 'Creating user')

  deleteUser = (user) => handleOperation(() => Parse.Cloud.run('delete-user', { id: user.id }), this, 'Deleting user')

  requestPasswordReset = (email) => handleOperation(() => Parse.User.requestPasswordReset(email), this, 'Requesting password reset')

  deleteObject = (object) => handleOperation(() => object.destroy(), this, 'Deleting record')

  deleteObjects = (objects) => handleOperation(() => Parse.Object.destroyAll(objects), this, `Deleting ${_.size(objects)} records`)

  saveObject = (object, attributes) => handleOperation(() => {
    _.each(attributes, (value, prop) => {
      object[prop] = value;
    });
    return object.save();
  }, this, 'Saving record')

  saveObjects = (objects) => handleOperation(() => Parse.Object.saveAll(objects), this, `Saving ${_.size(objects)} records`)

  getObjects = (className, queryParams = {}, { dispatch = true } = {}) => handleOperation(async () => {
    const query = buildQuery(className, queryParams);
    const objects = await query.find();

    if (objects.length) {
      _.each(queryParams.include, (includeField) => {
        const extraObjects = _(objects).map(`attributes.${includeField}`).compact().value();
        if (extraObjects.length && dispatch) {
          this.onEvent({ type: `${extraObjects[0].className}_ADDED`, objects: extraObjects });
        }
      });
      if (dispatch) {
        this.onEvent({ type: `${className}_ADDED`, objects });
      }
    }
    return objects;
  }, this, `Fetching records: ${className}`)

  getRelatedObjects = (object, relation, queryParams, dispatchEvent = false) => handleOperation(async () => {
    relation = object.relation(relation);

    const query = buildQuery(relation.query(), queryParams);
    const objects = await query.find();

    if (dispatchEvent && objects.length) {
      this.onEvent({ type: `${relation.targetClassName}_ADDED`, objects });
    }

    return objects;
  }, this, 'Fetching related records')

  removeRelatedObjects = (object, relation, objects) => handleOperation(() => {
    if (!objects.length) {
      return false;
    }

    relation = object.relation(relation);
    relation.remove(objects);

    return object.save();
  }, this, 'Deleting related records')

  runCloudCode = (name, data) => handleOperation(() => Parse.Cloud.run(name, data), this, `Performing operation: ${name}`)

  logEvent = (actionName, dimensions) => handleOperation(() => this.analytics.log(actionName, dimensions), this, `Logging event: ${actionName}`)

}
