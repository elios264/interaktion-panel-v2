import _ from 'lodash';
import { handleError, showSuccess, showWarning, showConfirm } from 'utils/actions';

export const saveContentDefinition = (contentDefinition, silentAndRethrow = false) => handleError(async (dispatch, getState, { api }) => {

  const result = await api.saveObject(contentDefinition);
  if (!silentAndRethrow) {
    dispatch(showSuccess({ content: 'The section has been successfully saved!' }));
  }
  api.logEvent('save-content-definition', result);
  return result;
}, silentAndRethrow ? null : 'The section could not be saved', { silent: silentAndRethrow, rethrow: silentAndRethrow });


export const deleteContentDefinition = (contentDefinition) => handleError(async (dispatch, getState, { api }) => {
  const hasContents = _.some(getState().objects.contents, (content) => content.definition.id === contentDefinition.id);

  if (hasContents) {
    dispatch(showWarning({
      title: 'Operation not performed',
      content: 'Before being able to delete this section you need to delete all of its contents',
    }));
    return;
  }

  const { result } = await dispatch(showConfirm({
    content: `Confirm DELETION of section "${contentDefinition.title[window.__ENVIRONMENT__.APP_LOCALE]}"?`,
    onAccept: () => api.deleteObject(contentDefinition),
  }));

  if (result) {
    dispatch(showSuccess({ content: `The section: "${contentDefinition.title[window.__ENVIRONMENT__.APP_LOCALE]}" has been successfully deleted.` }));
    api.logEvent('delete-content-definition', contentDefinition);
  }
  return result;
}, 'The section could not be deleted');
