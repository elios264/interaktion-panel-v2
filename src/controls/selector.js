import _ from 'lodash';
import { memo, useCallback } from 'react';
import PropTypes from 'prop-types';
import { Dropdown } from 'semantic-ui-react';

export const Selector = memo(({ value, onChange, ...extraProps }) => {

  const onOptionSelected = useCallback((e, { value: v }) => {
    onChange(v);
  }, [onChange]);

  return (
    <Dropdown
      fluid
      placeholder='Select...'
      selection
      selectOnNavigation={false}
      selectOnBlur={false}
      onChange={onOptionSelected}
      value={_.isNil(value) ? null : value}
      {...extraProps}
    />
  );

});

Selector.propTypes = {
  value: PropTypes.oneOfType([PropTypes.number, PropTypes.string, PropTypes.bool]),
  onChange: PropTypes.func,
};

Selector.defaultProps = {
  onChange: _.noop,
  value: undefined,
};
