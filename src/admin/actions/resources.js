import { handleError } from 'utils/actions';

export const saveResource = (resource) => handleError(async (dispatch, getState, { api }) => {
  const result = await api.saveObject(resource);
  return result;
}, 'Could not save the resource');
