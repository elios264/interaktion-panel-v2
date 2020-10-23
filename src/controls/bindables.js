import { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { Checkbox, Input } from 'semantic-ui-react';

export const withBind = (propEvent) => (WrappedComponent) => {
  class WithBind extends PureComponent {

    constructor() {
      super();
      this.handleEvent = this.handleEvent.bind(this);
    }

    handleEvent(...args) {
      const { bind, [propEvent]: onEvent } = this.props;
      return onEvent(bind, ...args);
    }

    render() {
      const { bind: ignored, [propEvent]: ignored2, ...extraProps } = this.props;
      const eventBinder = { [propEvent]: this.handleEvent };
      return (<WrappedComponent {...eventBinder} {...extraProps} />);
    }
  }

  WithBind.displayName = `WithBind(${WrappedComponent.displayName || WrappedComponent.name || 'Component'})`;

  WithBind.propTypes = {
    bind: PropTypes.any, // eslint-disable-line react/forbid-prop-types
    [propEvent]: PropTypes.func.isRequired,
  };

  return WithBind;
};

export const BoundAnchor = withBind('onClick')('a');
export const BoundCheckbox = withBind('onChange')(Checkbox);
export const BoundInput = withBind('onChange')(Input);
