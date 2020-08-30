import { handleError, showSuccess } from 'utils/actions';

export const saveContentDefinition = (contentDefinition, silentAndRethrow = false) => handleError(async (dispatch, getState, { api }) => {

  const result = await api.saveObject(contentDefinition);
  if (!silentAndRethrow) {
    dispatch(showSuccess({ content: 'The section has been successfully saved!' }));
  }
  api.logEvent('save-content-definition', result);
  return result;
}, silentAndRethrow ? null : 'The section could not be saved', { silent: silentAndRethrow, rethrow: silentAndRethrow });
