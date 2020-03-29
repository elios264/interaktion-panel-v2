import _ from 'lodash';
import Parse from 'parse';

const emailParams = ({ email }) => ({ email });

export class AnalyticsProvider {

  constructor({ getState }) {
    this.getState = getState;
  }

  async log(actionName, dimensions) {

    const definitions = {
      'login-user': _.stubObject,
      'logout-user': _.stubObject,
      'update-profile': _.stubObject,
      'create-user': emailParams,
      'delete-user': emailParams,
      'reset-password-user': emailParams,
    };

    const definition = definitions[actionName];

    if (!definition) {
      throw new Error(`Unknown actionName: ${actionName}`);
    }

    await Promise.all([
      Parse.Cloud.run('set-last-activity-now'),
      Parse.Analytics.track(actionName, definition(dimensions)),
    ]);
    return true;
  }
}
