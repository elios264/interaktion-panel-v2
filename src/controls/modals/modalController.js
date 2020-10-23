import _ from 'lodash';
import {
  isValidElement, cloneElement, createElement, PureComponent,
} from 'react';
import PropTypes from 'prop-types';
import { Modal, Button } from 'semantic-ui-react';

const modalProps = PropTypes.shape({
  options: PropTypes.shape({
    actions: PropTypes.oneOfType([
      PropTypes.bool.isRequired,
      PropTypes.func.isRequired,
      PropTypes.object.isRequired,
      PropTypes.node.isRequired,
    ]),
    content: PropTypes.oneOfType([
      PropTypes.node.isRequired,
      PropTypes.object.isRequired,
    ]),
    body: PropTypes.node,
    header: PropTypes.node,
    custom: PropTypes.func,
  }).isRequired,
  onClose: PropTypes.func.isRequired,
  id: PropTypes.string.isRequired,
}).isRequired;

export const ModalController = ({ modals }) => _.map(_.reverse(modals), (modal) => <ModalImplementation key={modal.id} modal={modal} />);
ModalController.propTypes = { modals: PropTypes.arrayOf(modalProps).isRequired };

class ModalImplementation extends PureComponent {

  constructor() {
    super();
    this.state = { loading: false };
    this.accept = this.onActionClick.bind(this, 'accept');
    this.cancel = this.onActionClick.bind(this, 'cancel');
    this.extra = this.onActionClick.bind(this, 'extra');
  }

  onCloseRequest = () => {
    const { modal } = this.props;
    modal.onClose(null, { key: 'cancel' });
  }

  async onActionClick(actionName) {
    const { modal } = this.props;
    const { onClose, options } = modal;
    const { [actionName]: action } = options.actions;

    this.setState({ loading: true });

    let result; let error;
    try {
      if (isValidElement(action)) {
        result = await _.invoke(action, 'props.onClick');
      } else if (_.isFunction(action)) {
        result = await action();
      } else if (_.isObject(action)) {
        result = await _.invoke(action, 'onClick');
      }
    } catch (err) {
      error = err;
    }

    this.setState({ loading: false });
    onClose(error, { key: actionName, result });
  }

  renderButton = (actionName, extraProps = {}) => {
    const { modal } = this.props;
    const { loading } = this.state;
    const { [actionName]: action } = modal.options.actions;

    if (isValidElement(action)) {
      return cloneElement(action, { loading, disabled: loading, onClick: this[actionName] });
    }
    if (_.isFunction(action) || action === true) {
      return createElement(Button, {
        ...extraProps, loading, disabled: loading, onClick: this[actionName],
      });
    }
    if (_.isString(action)) {
      return createElement(Button, {
        ...extraProps, content: action, loading, disabled: loading, onClick: this[actionName],
      });
    }
    if (_.isObject(action)) {
      return createElement(Button, {
        ...action, loading, disabled: loading, onClick: this[actionName],
      });
    }

    return null;
  };

  render() {
    const { modal } = this.props;
    const { onClose, options } = modal;
    const {
      content, header, body, custom: CustomModal, actions: ignored, ...rest
    } = options;

    if (CustomModal) {
      return <CustomModal {..._.omit(options, ['custom'])} onClose={onClose} />;
    }

    return (
      <Modal {...rest} open onClose={this.onCloseRequest} closeOnDimmerClick={false}>
        { !body
          ? (
            <>
              {header && <Modal.Header content={header} /> }
              {content && <Modal.Content content={content} /> }
            </>
          ) : body}
        <Modal.Actions>
          {this.renderButton('extra', { className: 'fl' })}
          {this.renderButton('cancel', { secondary: true, content: 'Cancel' })}
          {this.renderButton('accept', { primary: true, content: 'Okay' })}
        </Modal.Actions>
      </Modal>
    );

  }

}

ModalImplementation.propTypes = {
  modal: modalProps,
};
