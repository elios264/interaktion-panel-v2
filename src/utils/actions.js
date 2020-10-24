import _ from 'lodash';
import {
  showError, showModal, showSuccess, showConfirm, showWarning,
} from 'controls/modals';

export {
  showError, showModal, showSuccess, showConfirm, showWarning,
};

export const handleError = (fn, errorMessage = '', { rethrow = false, silent = false } = {}) => async (dispatch, ...rest) => {
  try {
    return await fn(dispatch, ...rest);
  } catch (err) {
    errorMessage = _.isFunction(errorMessage) ? errorMessage(dispatch, ...rest) : errorMessage;
    let exceptionMessage = _.isString(err)
      ? err : _.isObject(err)
        ? err.message || err.messages || err.responseText || JSON.stringify(err)
        : 'An unknown error has ocurred';

    if (!_.isString(exceptionMessage)) {
      exceptionMessage = JSON.stringify(exceptionMessage);
    }

    console.error(err);

    if (!silent) {
      await dispatch(showError({ header: errorMessage || undefined, content: exceptionMessage }));
    }

    if (rethrow) {
      throw new Error(errorMessage ? `${errorMessage}\n${exceptionMessage}` : exceptionMessage);
    }
  }
};
