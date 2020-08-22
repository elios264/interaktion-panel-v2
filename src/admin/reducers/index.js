import { combineReducers } from 'redux';

import { createCRUDObjectReducer, cleanWhenNoUser } from 'utils/reducers';
import { modals } from 'controls/modals/reducer';
import { siteInfoInfoReducer } from './siteInfo';
import { userInfoReducer } from './userInfo';

const objectsReducer = combineReducers({
  users: createCRUDObjectReducer('_User'),
  resources: createCRUDObjectReducer('Resource'),
  eventLogs: createCRUDObjectReducer('EventLog'),
  contentDefinitions: createCRUDObjectReducer('ContentDefinition'),
  contents: createCRUDObjectReducer('Content'),
});

export const rootReducer = combineReducers({
  modals,
  siteInfo: siteInfoInfoReducer,
  objects: cleanWhenNoUser(objectsReducer),
  userInfo: cleanWhenNoUser(userInfoReducer),
});
