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
const workingMessages = (state = {}, action) => {
  switch (action.type) {
    case 'BEGIN_OPERATION': return { ...state, [action.id]: action.message };
    case 'END_OPERATION': return _.omit(state, action.id);
    default: return state;
  }
};

export const siteInfoInfoReducer = combineReducers({
  config,
  isWorking,
  workingMessages,
  initializing: (state = false, action) => (action.type === 'INITIALIZING' ? action.running : state),
});
