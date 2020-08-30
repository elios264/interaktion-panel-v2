import { handleError, showSuccess } from 'utils/actions';

export const saveContent = (content, silentAndRethrow = false) => handleError(async (dispatch, getState, { api }) => {

  const result = await api.saveObject(content);
  if (!silentAndRethrow) {
    dispatch(showSuccess({ content: 'The content has been successfully saved!' }));
  }
  api.logEvent('save-content', result);
  return result;
}, silentAndRethrow ? null : 'The content could not be saved', { silent: silentAndRethrow, rethrow: silentAndRethrow });
