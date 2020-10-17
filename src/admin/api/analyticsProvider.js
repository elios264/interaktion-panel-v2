import _ from 'lodash';
import Parse from 'parse';

const emailParams = ({ email }) => ({ email });
const titleLanguageParams = ({ title }) => ({ name: title[window.__ENVIRONMENT__.APP_LOCALE] });
const lengthParams = ({ length }) => ({ amount: length });

export class AnalyticsProvider {

  constructor({ getState }) {
    this.getState = getState;
  }

  async log(actionName, dimensions) {

    const definitions = {
      'login-manager': _.stubObject,
      'logout-manager': _.stubObject,
      'update-profile': _.stubObject,
      'create-manager': emailParams,
      'delete-manager': emailParams,
      'reset-password-manager': emailParams,

      'update-profile-user': emailParams,
      'create-user': emailParams,
      'delete-user': emailParams,
      'reset-password-user': emailParams,

      'save-content-definition': titleLanguageParams,
      'delete-content-definition': titleLanguageParams,

      'save-content': titleLanguageParams,
      'clone-content': titleLanguageParams,
      'delete-content': titleLanguageParams,
      'delete-contents': lengthParams,

      'restore-collection': _.identity,
      'import-collection': _.identity,

      'update-privacy-policy': _.stubObject,
      'update-client-features': _.stubObject,
      'update-content-definitions-order': _.stubObject,
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
