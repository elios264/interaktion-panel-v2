import _ from 'lodash';
import { Config } from 'objects';

export const defaultConfig = _.keyBy([
  Config.create('client-features', { authMode: Config.authMode.private, allowSignup: false }),
  Config.create('privacy-policy-url', { [window.__ENVIRONMENT__.APP_LOCALE]: '' }),
], 'name');
