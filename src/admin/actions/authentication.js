import { handleError, showSuccess } from './utils';
import { downloadInitialData } from './initializers';


export const login = (loginData) => handleError(async (dispatch, getState, { api }) => {
  await api.login(loginData);
  dispatch(downloadInitialData());
  api.logEvent('login-user');
  return true;
}, 'Could not login');

export const logout = () => handleError(async (dispatch, getState, { api }) => {
  try {
    await api.logEvent('logout-user');
  } catch { /* let's just try, if there's an error let's logout anyways */ }
  api.logout();
  return true;
}, 'Something went horribly wrong while trying to logout');

export const resetPassword = ({ email }) => handleError(async (dispatch, getState, { api }) => {
  await api.requestPasswordReset(email);
  dispatch(showSuccess({ content: 'A password reset email has been sent to the provided email.' }));
  return true;
}, 'Could not send the email reset password');
