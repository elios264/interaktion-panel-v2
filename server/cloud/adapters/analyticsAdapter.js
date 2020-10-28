/* global Parse */
const _ = require('lodash');

const EventLog = Parse.Object.extend('EventLog');

class AnalyticsAdapter {

  appOpened() {
    return Promise.resolve({});
  }

  trackEvent(eventName, parameters, req) {
    const userId = _.get(req, 'auth.user.id');
    const sessionToken = _.result(req, 'auth.user.getSessionToken');
    const { dimensions } = parameters;

    return new EventLog().save({ userId, eventName, dimensions }, { sessionToken });
  }

}

module.exports = AnalyticsAdapter;
