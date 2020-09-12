import _ from 'lodash';
import { handleError, showSuccess, showConfirm } from 'utils/actions';

export const saveContent = (content, silentAndRethrow = false) => handleError(async (dispatch, getState, { api }) => {

  const result = await api.saveObject(content);
  if (!silentAndRethrow) {
    dispatch(showSuccess({ content: 'The content has been successfully saved!' }));
  }
  api.logEvent('save-content', result);
  return result;
}, silentAndRethrow ? null : 'The content could not be saved', { silent: silentAndRethrow, rethrow: silentAndRethrow });

export const deleteContent = (content) => handleError(async (dispatch, getState, { api }) => {
  const { result } = await dispatch(showConfirm({
    content: `Confirm PERMANENT deletion of content "${content.title[window.__ENVIRONMENT__.APP_LOCALE]}"`,
    onAccept: () => api.deleteObject(content),
  }));

  if (result) {
    dispatch(showSuccess({ content: `The content "${content.title[window.__ENVIRONMENT__.APP_LOCALE]}" has been successfully deleted!` }));
    api.logEvent('delete-content', content);
  }
  return result;
}, 'The content could not be deleted');

export const deleteSelectedContents = (contentsIds) => handleError(async (dispatch, getState, { api }) => {
  const contents = _.values(_.pick(getState().objects.contents, contentsIds));

  if (!contents.length) {
    return true;
  }

  const { result } = await dispatch(showConfirm({
    content: `Confirm PERMANENT deletion of ${contents.length} content(s)`,
    onAccept: () => api.deleteObjects(contents),
  }));

  if (result) {
    dispatch(showSuccess({ content: `${contents.length} content(s) have been successfully deleted!` }));
    api.logEvent('delete-contents', contents);
  }
  return result;
}, 'The contents(s) could not be deleted');

export const cloneContent = (content) => handleError(async (dispatch, getState, { api }) => {
  const { result } = await dispatch(showConfirm({
    content: `Confirm cloning of content "${content.title[window.__ENVIRONMENT__.APP_LOCALE]}"`,
    onAccept: () => api.saveObject(content.clone(), { title: { ...content.title, [window.__ENVIRONMENT__.APP_LOCALE]: `${_.truncate(content.title[window.__ENVIRONMENT__.APP_LOCALE], { length: 190 })} copy` } }),
  }));

  if (result) {
    dispatch(showSuccess({ content: `The content "${content.title[window.__ENVIRONMENT__.APP_LOCALE]}" has been successfully cloned!` }));
    api.logEvent('clone-content', result);
  }
  return result;
}, 'An error ocurred when cloning the content');
