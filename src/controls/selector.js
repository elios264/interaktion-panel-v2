import _ from 'lodash';
import { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { Dropdown } from 'semantic-ui-react';

export class Selector extends PureComponent {

  static propTypes = {
    value: PropTypes.any,
    onChange: PropTypes.func,
  }

  static defaultProps = {
    onChange: _.noop,
  }

  onOptionSelected = (e, { value }) => {
    const { onChange } = this.props;
    onChange(value);
  }

  render() {
    const { value } = this.props;
    const extraProps = _.omit(this.props, _.keys(Selector.propTypes));

    return (
      <Dropdown
        fluid
        placeholder='Select...'
        selection
        selectOnNavigation={false}
        selectOnBlur={false}
        onChange={this.onOptionSelected}
        value={_.isNil(value) ? null : value}
        {...extraProps} />
    );
  }

}
