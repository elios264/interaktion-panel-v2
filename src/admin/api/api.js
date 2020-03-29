import _ from 'lodash';
import Parse from 'parse';
import { debounceCall } from 'controls/utils';
import { Config, User, Resource, EventLog } from 'objects';
import { buildQuery, handleOperation } from 'utils/api';
import { AnalyticsProvider } from './analyticsProvider';

Parse.Object.disableSingleInstance();
Parse.Object.registerSubclass('_User', User);
Parse.Object.registerSubclass('Resource', Resource);
Parse.Object.registerSubclass('Config', Config);
Parse.Object.registerSubclass('EventLog', EventLog);

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

  @handleOperation('Logging in', { login: true })
  async login({ email, password }) {
    if (Parse.User.current()) {
      Parse.User.logOut();
    }

    let user = await Parse.User.logIn(email, password);

    const userJSON = user.toJSON();
    userJSON.className = '_User';
    user = Parse.Object.fromJSON(userJSON);

    this.initializeRealTime();

    this.onEvent({ type: 'SET_USER', user });
    return user;
  }

  logout() {
    this.terminateRealTime();
    Parse.User.logOut();
    this.onEvent({ type: 'SET_USER', user: null });
  }

  @handleOperation('Updating profile')
  async updateProfile(user) {
    if (user instanceof User) {
      await user.save();
    } else {
      await Parse.User.current().save(user);
      await Parse.User.current().fetch();
    }
    return true;
  }

  @handleOperation('Creating user')
  createUser({ email, name }) {
    return Parse.Cloud.run('create-user', { name, email });
  }

  @handleOperation('Deleting user')
  deleteUser(user) {
    return Parse.Cloud.run('delete-user', { id: user.id });
  }

  @handleOperation('Requesting password reset')
  requestPasswordReset(email) {
    return Parse.User.requestPasswordReset(email);
  }

  @handleOperation('Deleting record')
  deleteObject(object) {
    return object.destroy();
  }

  @handleOperation('Deleting records')
  deleteObjects(objects) {
    return Parse.Object.destroyAll(objects);
  }

  @handleOperation('Saving record')
  saveObject(object, attributes) {
    _.each(attributes, (value, prop) => {
      object[prop] = value;
    });
    return object.save();
  }

  @handleOperation('Saving records')
  saveObjects(objects) {
    return Parse.Object.saveAll(objects);
  }

  @handleOperation('Fetching records')
  async getObjects(className, queryParams = {}, { dispatch = true } = {}) {
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
  }

  @handleOperation('Fetching related records')
  async getRelatedObjects(object, relation, queryParams, dispatchEvent = false) {
    relation = object.relation(relation);

    const query = buildQuery(relation.query(), queryParams);
    const objects = await query.find();

    if (dispatchEvent && objects.length) {
      this.onEvent({ type: `${relation.targetClassName}_ADDED`, objects });
    }

    return objects;
  }

  @handleOperation('Deleting related records')
  removeRelatedObjects(object, relation, objects) {
    if (!objects.length) {
      return false;
    }

    relation = object.relation(relation);
    relation.remove(objects);

    return object.save();
  }

  @handleOperation('Performing backend operation')
  runCloudCode(name, data) {
    return Parse.Cloud.run(name, data);
  }

  @handleOperation('Logging event')
  logEvent(actionName, dimensions) {
    return this.analytics.log(actionName, dimensions);
  }
}
