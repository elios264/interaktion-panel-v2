import _ from 'lodash';
import Parse from 'parse';

import { User, BaseObject, Resource } from 'objects';
import { buildQuery, handleOperation } from 'utils/api';
import { AnalyticsProvider } from './analyticsProvider';

export class Api {

  constructor() {
    Parse.initialize(window.__ENVIRONMENT__.PARSE_APPID);
    Parse.serverURL = `${window.__ENVIRONMENT__.APP_URL}${window.__ENVIRONMENT__.PARSE_PATH}`;
  }

  onEvent = () => console.error('Call initialize with onEventCallback first');

  onEventForChildrenResources = (objects) => {
    const [resources, pointerResources] = _(objects)
      .castArray()
      .filter((object) => !(object instanceof Resource))
      .flatMap((object) => _.flatMap(object.attributes, (value) => {
        if (value instanceof Resource) return [value];
        if (_.isArray(value) && value[0] instanceof Resource) return value;
        return [];
      }))
      .partition((resource) => resource.src)
      .value();

    if (resources.length) {
      this.onEvent({ type: 'Resource_UPDATED', objects: resources });
    }
    if (pointerResources.length) {
      this.getObjects('Resource', { containedIn: { objectId: _.map(pointerResources, 'id') } });
    }
  }

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
      this.onEvent({ type: 'SET_USER', user });
      Parse.Cloud.run('set-last-activity-now');
    }

    return user;
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

    this.onEvent({ type: 'SET_USER', user });
    return user;
  }, this, 'Logging in', { login: true })

  logout() {
    Parse.User.logOut();
    this.onEvent({ type: 'SET_USER', user: null });
  }

  updateProfile = (user) => handleOperation(async () => {
    await user.save();
    this.onEvent({ type: 'SET_USER', user });
    this.onEventForChildrenResources(user);
    return true;
  }, this, 'Updating profile')

  updateUser = (user) => handleOperation(async () => {
    if (user.photo && user.dirty('photo') && !user.photo.id) {
      await user.photo.save();
    }
    const { user: result } = await Parse.Cloud.run('update-user', { user: BaseObject.toFullJSON(user), fields: user.dirtyKeys() });
    this.onEvent({ type: '_User_UPDATED', objects: [result] });
    this.onEventForChildrenResources(user);
    return result;
  }, this, 'Updating user');

  createManager = ({ email, name }) => handleOperation(async () => {
    const { user } = await Parse.Cloud.run('create-manager', { name, email });
    this.onEvent({ type: '_User_ADDED', objects: [user] });
    return user;
  }, this, 'Creating manager')

  createUser = ({ email, name }) => handleOperation(async () => {
    const { user } = await Parse.Cloud.run('create-user', { name, email });
    this.onEvent({ type: '_User_ADDED', objects: [user] });
    return user;
  }, this, 'Creating user')

  deleteUser = (user) => handleOperation(async () => {
    const result = await Parse.Cloud.run('delete-user', { id: user.id });
    this.onEvent({ type: '_User_REMOVED', objects: [user] });
    return result;
  }, this, 'Deleting user')

  requestPasswordReset = (email) => handleOperation(() => Parse.User.requestPasswordReset(email), this, 'Requesting password reset')

  deleteObject = (object) => handleOperation(async () => {
    await object.destroy();
    this.onEvent({ type: `${object.className}_REMOVED`, objects: [object] });
    return object;
  }, this, 'Deleting record')

  deleteObjects = (objects) => handleOperation(async () => {
    const results = await Parse.Object.destroyAll(objects);

    _(objects).groupBy('className').each((classNameObjects, className) => {
      this.onEvent({ type: `${className}_REMOVED`, objects: classNameObjects });
    });

    return results;
  }, this, `Deleting ${_.size(objects)} records`)

  saveObject = (object, attributes) => handleOperation(async () => {
    _.each(attributes, (value, prop) => {
      object[prop] = value;
    });
    const result = await object.save();
    this.onEvent({ type: `${object.className}_UPDATED`, objects: [object] });
    this.onEventForChildrenResources(object);
    return result;
  }, this, 'Saving record')

  saveObjects = (objects) => handleOperation(async () => {
    const results = await Parse.Object.saveAll(objects);

    _(objects).groupBy('className').each((classNameObjects, className) => {
      this.onEvent({ type: `${className}_UPDATED`, objects: classNameObjects });
    });
    this.onEventForChildrenResources(results);

    return results;
  }, this, `Saving ${_.size(objects)} records`)

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

  runCloudCode = (name, data) => handleOperation(() => Parse.Cloud.run(name, data), this, `Performing operation: ${name}`)

  logEvent = (actionName, dimensions) => handleOperation(async () => {
    const log = await this.analytics.log(actionName, dimensions);
    this.onEvent({ type: 'EventLog_ADDED', objects: [BaseObject.fromJSON({ ...log, className: 'EventLog' })] });
    return true;
  }, this, `Logging event: ${actionName}`)
}
