import _ from 'lodash';
import { handleError } from 'utils/actions';

export const initialize = () => handleError(async (dispatch, getState, { api }) => {
  dispatch({ type: 'INITIALIZING', running: true });

  const user = await api.initialize({ dispatch, getState });
  if (user) {
    dispatch(downloadInitialData());
  }

  dispatch({ type: 'INITIALIZING', running: false });
}, 'An error has occurred initializing the system');

export const downloadInitialData = () => handleError(async (dispatch, getState, { api }) => {

  const operations = [
    api.getObjects('_User'),
    api.getObjects('Resource'),
    api.getObjects('Config'),
    api.getObjects('EventLog'),
    api.getObjects('ContentDefinition'),
    api.getObjects('Content'),
  ];

  const firstError = await Promise.allSettled(operations).then((results) => _.find(results, ['status', 'rejected']));
  if (firstError) {
    throw firstError.reason;
  }

  return true;
}, 'A problem occurred when downloading some of the initial data from the server');
