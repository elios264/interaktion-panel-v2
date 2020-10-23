import { handleError, showSuccess, showConfirm } from 'utils/actions';

export const updateProfile = (user) => handleError(async (dispatch, getState, { api }) => {
  await api.updateProfile(user);
  dispatch(showSuccess({ content: 'Your profile has been successfully updated!' }));
  api.logEvent('update-profile');
  return true;
}, 'Error updating profile');

export const requestPasswordReset = (user) => handleError(async (dispatch, getState, { api }) => {
  await api.requestPasswordReset(user.email);
  dispatch(showSuccess({ content: `¡An email has been sent to reset the password for manager with email "${user.email}"!` }));
  api.logEvent('reset-password-manager', user);
  return true;
}, 'Error sending the reset password email');

export const createManager = (user) => handleError(async (dispatch, getState, { api }) => {

  await api.createManager(user);

  dispatch(showSuccess({ content: `The manager "${user.name}" has been successfully created!` }));
  api.logEvent('create-manager', user);

  return true;
}, 'The manager could not be created');

export const deleteManager = (user) => handleError(async (dispatch, getState, { api }) => {

  const { result } = await dispatch(showConfirm({
    content: `Confirm the DELETION of manager "${user.name}"`,
    onAccept: () => api.deleteUser(user),
  }));

  if (result) {
    dispatch(showSuccess({ content: `Manager "${user.name}" has been successfully deleted` }));
    api.logEvent('delete-manager', user);
  }

  return result;

}, 'The manager could not be deleted');
