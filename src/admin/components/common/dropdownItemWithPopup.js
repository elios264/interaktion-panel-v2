import _ from 'lodash';
import PropTypes from 'prop-types';
import React from 'react';
import { Dropdown } from 'semantic-ui-react';
import { Popup } from 'controls';

export const DropdownItemWithPopup = ({ disabled, onClick, popupMessage, ...rest }) => {

  const dropdown = (
    <Dropdown.Item
      {...rest}
      disabled={disabled}
      style={{ pointerEvents: 'all' }}
      onClick={disabled ? _.noop : onClick} />
  );

  if (!disabled) {
    return dropdown;
  }

  return (
    <Popup message={popupMessage}>
      {dropdown}
    </Popup>
  );
};

DropdownItemWithPopup.propTypes = {
  onClick: PropTypes.func,
  disabled: PropTypes.bool,
  popupMessage: PropTypes.string.isRequired,
};
