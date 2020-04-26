import _ from 'lodash';
import PropTypes from 'prop-types';
import React from 'react';
import { Popup, AwaitableDropdownItem } from 'controls';

export const DropdownItemWithPopup = ({ disabled, onClick, popupMessage, ...rest }) => {

  const dropdown = (
    <AwaitableDropdownItem
      {...rest}
      disabled={disabled}
      style={{ pointerEvents: 'all' }}
      onClick={disabled ? _.noop : onClick} />
  );

  if (!disabled) {
    return dropdown;
  }

  return (
    <Popup message={popupMessage} inverted>
      {dropdown}
    </Popup>
  );
};

DropdownItemWithPopup.propTypes = {
  onClick: PropTypes.func,
  disabled: PropTypes.bool,
  popupMessage: PropTypes.string.isRequired,
};
