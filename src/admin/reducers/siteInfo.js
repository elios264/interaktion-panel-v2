import _ from 'lodash';
import { combineReducers } from 'redux';

import { defaultConfig } from 'defaultConfig';
import { createCRUDObjectReducer, cleanWhenNoUser } from 'utils/reducers';


const configReducer = createCRUDObjectReducer('Config', { key: 'name' });
const config = cleanWhenNoUser((state, action) => {
  const newConfig = configReducer(state, action);
  return _.defaults(newConfig, defaultConfig);
});

const isWorking = (state = 0, action) => {
  switch (action.type) {
    case 'BEGIN_OPERATION': return state + 1;
    case 'END_OPERATION': return state - 1;
    default: return state;
  }
};
const workingMessage = (state = '', action) => {
  switch (action.type) {
    case 'BEGIN_OPERATION': return action.message;
    case 'END_OPERATION': return '';
    default: return state;
  }
};

export const siteInfoInfoReducer = combineReducers({
  config,
  isWorking,
  workingMessage,
  initializing: (state = false, action) => action.type === 'INITIALIZING' ? action.running : state,
});
