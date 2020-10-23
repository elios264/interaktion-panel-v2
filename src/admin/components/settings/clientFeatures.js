import _ from 'lodash';
import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { Segment, Button, Header, Radio, Grid, Form } from 'semantic-ui-react';
import Joi from 'joi';

import { Config } from 'objects';
import { Popup } from 'controls';
import { useFieldset, useDispatchCallback } from 'controls/hooks';
import { saveClientFeatures } from 'admin/actions/settings';

const clientFeaturesSchema = {
  authMode: Joi.string().valid(..._.values(Config.authMode)).required().label('Auth mode'),
};

export const ClientFeatures = () => {
  const clientFeatures = useSelector((state) => state.siteInfo.config['client-features']);
  const clientFeaturesInstance = useMemo(() => clientFeatures.value, [clientFeatures.valueString]); // eslint-disable-line react-hooks/exhaustive-deps

  const { fields: { authMode }, submit, loading, reset } = useFieldset({
    schema: clientFeaturesSchema,
    onSubmit: useDispatchCallback(saveClientFeatures),
    source: clientFeaturesInstance,
  });

  return (
    <Segment raised>
      <Form onSubmit={submit}>
        <div className='mb4'>
          <Header
            content='Client features'
            size='large'
            subheader='Configure the features you want for the client app.'
            icon='info' />
        </div>
        <Grid>
          <Grid.Column>
            <Popup message={authMode.message} enabled={authMode.errored}>
              <Form.Field error={authMode.errored}><label>Auth mode</label></Form.Field>
            </Popup>
            <Form.Field><Radio label='Private access' checked={authMode.value === Config.authMode.private} name='radioGroup' onChange={authMode.onChange} value={Config.authMode.private} /></Form.Field>
            <Form.Field><Radio label='Mixed access' checked={authMode.value === Config.authMode.mixed} name='radioGroup' onChange={authMode.onChange} value={Config.authMode.mixed} /></Form.Field>
            <Form.Field><Radio label='Public access' checked={authMode.value === Config.authMode.public} name='radioGroup' onChange={authMode.onChange} value={Config.authMode.public} /></Form.Field>
          </Grid.Column>
        </Grid>
        <div className='tr mt3'>
          <Button
            type='button'
            className='w-100 w-auto-ns'
            secondary
            disabled={loading}
            loading={loading}
            onClick={reset}
            icon='cancel'
            content='Cancel' />
          <div className='db mt1 di-ns mt0-ns' />
          <Button
            type='submit'
            disabled={loading}
            loading={loading}
            className='w-100 w-auto-ns'
            primary
            icon='edit'
            content='Save' />
        </div>
      </Form>
    </Segment>
  );
};
