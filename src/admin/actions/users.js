import { handleError, showSuccess, showConfirm } from 'utils/actions';

export const updateProfile = (user) => handleError(async (dispatch, getState, { api }) => {
  await api.updateUser(user);
  dispatch(showSuccess({ content: 'The user\'s profile has been successfully updated!' }));
  api.logEvent('update-profile-user', user);
  return true;
}, 'Error updating the user\'s profile');

export const requestPasswordReset = (user) => handleError(async (dispatch, getState, { api }) => {
  await api.requestPasswordReset(user.email);
  dispatch(showSuccess({ content: `¡An email has been sent to reset the password for user with email "${user.email}"!` }));
  api.logEvent('reset-password-user', user);
  return true;
}, 'Error sending the reset password email');

export const createUser = (user) => handleError(async (dispatch, getState, { api }) => {

  await api.createUser(user);

  dispatch(showSuccess({ content: `The user "${user.name}" has been successfully created!` }));
  api.logEvent('create-user', user);

  return true;
}, 'The user could not be created');

export const deleteUser = (user) => handleError(async (dispatch, getState, { api }) => {

  const { result } = await dispatch(showConfirm({
    content: `Confirm the DELETION of user "${user.name}"`,
    onAccept: () => api.deleteUser(user),
  }));

  if (result) {
    dispatch(showSuccess({ content: `User "${user.name}" has been successfully deleted` }));
    api.logEvent('delete-user', user);
  }

  return result;

}, 'The user could not be deleted');
