import React from 'react';
import PropTypes from 'prop-types';
import { Helmet } from 'react-helmet';
import Joi from 'joi';
import { Form, Button, Modal, Input } from 'semantic-ui-react';

import { User } from 'objects';
import { Popup } from 'controls';
import { useFieldset, useAsyncSubmit, useDispatchCallback } from 'controls/hooks';
import { createManager } from 'admin/actions/managers';

const newManagerTemplate = new User();
const newManagerSchema = {
  name: Joi.string().trim().required().max(50).label('Name'),
  email: Joi.string().email({ tlds: { allow: false } }).required().max(50).label('Email'),
};

export const CreateManagerModal = ({ onCancel }) => {

  const onSubmit = useAsyncSubmit(useDispatchCallback(createManager), onCancel);
  const { fields: { name, email }, submit, loading } = useFieldset({ schema: newManagerSchema, source: newManagerTemplate, onSubmit });

  return (
    <Modal size='tiny' onClose={onCancel} open closeOnDimmerClick={false} closeIcon={false}>
      <Helmet title='New manager' />
      <Modal.Header content='New manager' />
      <Modal.Content as={Form}>
        <Form.Field error={name.errored} required>
          <label>Name</label>
          <Popup message={name.message} enabled={name.errored}>
            <Input value={name.value || ''} onChange={name.onChange} autoComplete='off' />
          </Popup>
        </Form.Field>
        <Form.Field error={email.errored} required>
          <label>Email</label>
          <Popup message={email.message} enabled={email.errored}>
            <Input value={email.value || ''} onChange={email.onChange} autoComplete='off' />
          </Popup>
        </Form.Field>
      </Modal.Content>
      <Modal.Actions>
        <Button disabled={loading} loading={loading} secondary content='Cancel' onClick={onCancel} />
        <Button onClick={submit} disabled={loading} loading={loading} primary icon='right chevron' labelPosition='right' content='Create' />
      </Modal.Actions>
    </Modal>
  );
};

CreateManagerModal.propTypes = {
  onCancel: PropTypes.func.isRequired,
};
