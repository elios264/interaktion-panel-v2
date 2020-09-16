import _ from 'lodash';
import { Config } from 'objects';

export const defaultConfig = _.keyBy([
  Config.create('client-features', { authMode: Config.authMode.private }),
], 'name');
