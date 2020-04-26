import _ from 'lodash';
import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { Dropdown } from 'semantic-ui-react';

export class Selector extends PureComponent {

  static propTypes = {
    value: PropTypes.any,
    onChange: PropTypes.func,
    options: PropTypes.array,
    disabled: PropTypes.bool,
    inline: PropTypes.bool,
  }

  static defaultProps = {
    onChange: _.noop,
  }

  onOptionSelected = (e, { value }) => {
    const { onChange } = this.props;
    onChange(value);
  }

  render() {
    const { value, options, disabled, inline } = this.props;
    const extraProps = _.omit(this.props, _.keys(Selector.propTypes));

    return (
      <Dropdown
        fluid
        placeholder='Select...'
        selection
        options={options}
        selectOnNavigation={false}
        selectOnBlur={false}
        onChange={this.onOptionSelected}
        value={_.isNil(value) ? null : value}
        inline={inline}
        disabled={disabled}
        {...extraProps} />
    );
  }

}
