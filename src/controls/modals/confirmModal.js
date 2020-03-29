import _ from 'lodash';
import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { Modal, Button, Form, Radio } from 'semantic-ui-react';


export class ConfirmModal extends PureComponent {

  static propTypes = {
    header: PropTypes.string.isRequired,
    onCancel: PropTypes.func,
    onAccept: PropTypes.func,
    options: PropTypes.arrayOf(PropTypes.string),
    content: PropTypes.node.isRequired,
    onClose: PropTypes.func,
    cancelText: PropTypes.string,
    acceptText: PropTypes.string,
  }

  state = {
    loading: false,
    selectedOption: 0,
  }

  onCloseRequest = () => {
    const { onClose } = this.props;
    onClose(null, { key: 'cancel' });
  }

  handleActionClick = async (action) => {
    const { onAccept, onCancel, onClose, options } = this.props;
    let error; let result;
    try {
      this.setState({ loading: true });
      const actionToExecute = action === 'accept' ? onAccept : onCancel;
      result = actionToExecute ? await actionToExecute(options && this.state.selectedOption) : undefined;
    } catch (err) {
      error = err;
    }
    this.setState({ loading: false });
    const key = action === 'accept' ? 'accept' : 'cancel';
    onClose(error, { key, actionName: action, result });
  }

  handleOptionChange = (e, { value }) => {
    this.setState({ selectedOption: value });
  }

  render() {
    const { content, header, options, cancelText, acceptText, onAccept: ignored, ...rest } = this.props;
    const { loading, selectedOption } = this.state;

    return (
      <Modal {...rest} open onClose={this.onCloseRequest} closeOnDimmerClick={false}>
        <Modal.Header icon='question' content={header} />
        <Modal.Content>
          {content}
          {options && (
            <Form className='mt3'>

              {_.map(options, (optionName, index) => (
                <Form.Field key={index}>
                  <Radio
                    label={optionName}
                    name={optionName}
                    value={index}
                    checked={selectedOption === index}
                    onChange={this.handleOptionChange} />
                </Form.Field>
              ))}
            </Form>
          )}
        </Modal.Content>
        <Modal.Actions>
          <Button secondary loading={loading} disabled={loading} content={cancelText || 'Cancel'} onClick={this.handleActionClick.bind(null, 'cancel')} />
          <Button primary loading={loading} disabled={loading} content={acceptText || 'Okay'} onClick={this.handleActionClick.bind(null, 'accept')} />
        </Modal.Actions>
      </Modal>
    );

  }

}
