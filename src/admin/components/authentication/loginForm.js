import React from 'react';
import { Image, Segment, Grid, Icon, Message, Form, Input, Button } from 'semantic-ui-react';
import { Link } from 'react-router-dom';
import Joi from '@hapi/joi';

import { Popup } from 'controls';
import { login } from 'admin/actions/authentication';
import { useFieldset, useDispatchCallback } from 'controls/hooks';

const loginForm = { email: '', password: '' };
const loginSchema = {
  email: Joi.string().email().max(50).required().label('Email'),
  password: Joi.string().required().label('Password').max(30),
};

export const LoginForm = React.memo(() => {
  const { fields: { email, password }, submit, loading } = useFieldset({ schema: loginSchema, source: loginForm, onSubmit: useDispatchCallback(login) });

  return (
    <div className='login-form flex flex-column min-vh-100 w-100 pa3'>
      <Grid textAlign='center' className='flex-auto' verticalAlign='middle'>
        <Grid.Column style={{ maxWidth: 450 }}>
          <Image src={window.__ENVIRONMENT__.APP_LOGO_URL} alt='logo' size='medium' className='center mb4' />
          <Segment stacked>
            <Form onSubmit={submit}>
              <Form.Field error={email.errored}>
                <Popup message={email.message} enabled={email.errored}>
                  <Input fluid icon='mail' iconPosition='left' placeholder='Email' autoComplete='email' value={email.value} onChange={email.onChange} />
                </Popup>
              </Form.Field>
              <Form.Field error={password.errored}>
                <Popup message={password.message} enabled={password.errored}>
                  <Input fluid icon='lock' iconPosition='left' type='password' placeholder='Password' autoComplete='current-password' value={password.value} onChange={password.onChange} />
                </Popup>
              </Form.Field>
              <Button type='submit' disabled={loading} loading={loading} primary fluid size='large'><Icon name='key' />Login</Button>
            </Form>
          </Segment>
          <Message>
            Forgot your password? <Link to='/forgot-password'>Click here</Link>
          </Message>
        </Grid.Column>
      </Grid>
      <div className='mt3 justify-between flex-wrap flex'>
        <div className='mr3'>Build: <span className='b'>{window.__ENVIRONMENT__.BUILD}</span> Environment: <span className='b'>{window.__ENVIRONMENT__.BUILD_ENVIRONMENT}</span></div>
        <div>Developed by <a className='contrast dim' href='mailto:elios264@outlook.com' rel='noopener noreferrer' target='_blank'>elios264</a></div>
      </div>
    </div>
  );
});
