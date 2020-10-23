import { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { Checkbox, Input } from 'semantic-ui-react';


export const withBind = (propEvent) => (WrappedComponent) => {
  class WithBind extends PureComponent {

    static displayName = `WithBind(${WrappedComponent.displayName || WrappedComponent.name || 'Component'})`
    static propTypes = {
      bind: PropTypes.any,
      [propEvent]: PropTypes.func.isRequired,
    }

    constructor(props) {
      super(props);
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
  return WithBind;
};

export const BoundAnchor = withBind('onClick')('a');
export const BoundCheckbox = withBind('onChange')(Checkbox);
export const BoundInput = withBind('onChange')(Input);
