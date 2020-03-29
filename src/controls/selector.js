import _ from 'lodash';
import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { Dropdown, Icon } from 'semantic-ui-react';

export class Selector extends PureComponent {

  static propTypes = {
    value: PropTypes.any,
    onChange: PropTypes.func,
    options: PropTypes.array,
    allowClear: PropTypes.bool,
    disabled: PropTypes.bool,
    inline: PropTypes.string,
  }

  static defaultProps = {
    onChange: _.noop,
  }

  onOptionSelected = (e, { value }) => {
    const { onChange } = this.props;
    onChange(value);
  }

  handleClear = () => {
    const { onChange } = this.props;
    onChange(undefined);
  }

  render() {
    const { value, options, disabled, allowClear, inline } = this.props;
    const extraProps = _.omit(this.props, _.keys(Selector.propTypes));

    return (
      <div className={`relative ${inline ? 'di' : ''}`}>
        {!_.isUndefined(value) && !disabled && allowClear && <Icon link name='close' className='clear-icon' onClick={this.handleClear} />}
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
      </div>
    );
  }

}
