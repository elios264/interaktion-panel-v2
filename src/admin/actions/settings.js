import _ from 'lodash';
import { handleError, showSuccess } from 'utils/actions';

export const saveContentDefinitionsOrders = ({ contentDefinitions }) => handleError(async (dispatch, getState, { api }) => {

  const contentDefinitionsToSave = _.map(contentDefinitions, (contentDefinition, i) => {
    contentDefinition.order = i;
    return contentDefinition;
  });

  const result = await api.saveObjects(contentDefinitionsToSave);
  dispatch(showSuccess({ content: 'The sections order has been successfully updated.' }));
  api.logEvent('update-content-definitions-order');
  return result;
}, 'Could not update the sections order');

export const saveClientFeatures = (value) => handleError(async (dispatch, getState, { api }) => {
  const result = await api.saveObject(getState().siteInfo.config['client-features'].copy(), { value });
  dispatch(showSuccess({ content: 'The client features have been updated.' }));
  api.logEvent('update-client-features');
  return result;
}, 'Could not update the client features');

export const savePrivacyPolicyUrl = ({ privacyPolicyUrl }) => handleError(async (dispatch, getState, { api }) => {
  const result = await api.saveObject(getState().siteInfo.config['privacy-policy-url'].copy(), { value: privacyPolicyUrl });
  dispatch(showSuccess({ content: 'The privacy police url has been updated.' }));
  api.logEvent('update-privacy-policy');
  return result;
}, 'Could not update the privacy police');
