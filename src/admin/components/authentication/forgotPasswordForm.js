import { memo } from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import Joi from 'joi';
import {
  Header, Image, Segment, Form, Button, Grid, Message, Input,
} from 'semantic-ui-react';

import { Popup } from 'controls';
import { useFieldset, useDispatchCallback } from 'controls/hooks';
import { resetPassword } from 'admin/actions/authentication';

const forgotForm = { email: '' };
const forgotSchema = {
  email: Joi.string().email({ tlds: { allow: false } }).required().max(50).label('Email'),
};

export const ForgotPasswordForm = memo(() => {
  const { fields: { email }, submit, loading } = useFieldset({ schema: forgotSchema, source: forgotForm, onSubmit: useDispatchCallback(resetPassword) });

  return (
    <div className='reset-password-form flex flex-column min-vh-100 w-100 pa3'>
      <Helmet title='Password reset' />
      <Grid textAlign='center' className='flex-auto' verticalAlign='middle'>
        <Grid.Column style={{ maxWidth: 450 }}>
          <Image src={window.__ENVIRONMENT__.APP_LOGO_URL} alt='logo' size='medium' className='center mb4' />
          <Segment stacked>
            <Form onSubmit={submit}>
              <Header as='h4'>Write the email associated to your account</Header>
              <Form.Field error={email.errored}>
                <Popup message={email.message} enabled={email.errored}>
                  <Input fluid icon='mail' iconPosition='left' placeholder='awesome@email.com' autoComplete='email' value={email.value} onChange={email.onChange} />
                </Popup>
              </Form.Field>
              <Button type='submit' disabled={loading} loading={loading} primary fluid size='large'>Reset password</Button>
            </Form>
          </Segment>
          <Message>
            Remembered it?
            {' '}
            <Link to='/login'>Click here</Link>
          </Message>
        </Grid.Column>
      </Grid>
      <div className='mt3 justify-between flex-wrap flex'>
        <div className='mr3'>
          Build:
          <span className='b'>{window.__ENVIRONMENT__.BUILD}</span>
          {' '}
          Environment:
          <span className='b'>{window.__ENVIRONMENT__.BUILD_ENVIRONMENT}</span>
        </div>
        <div>
          Developed by
          <a className='contrast dim' href='mailto:elios264@outlook.com' rel='noopener noreferrer' target='_blank'>elios264</a>
        </div>
      </div>
    </div>
  );
});
