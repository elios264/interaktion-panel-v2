import { memo, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { Link, Redirect } from 'react-router-dom';
import Joi from 'joi';
import queryString from 'query-string';
import {
  Image, Segment, Form, Button, Grid, Message, Input,
} from 'semantic-ui-react';

import { Popup } from 'controls';
import { useFieldset, useUrlParams } from 'controls/hooks';

const resetForm = { password: '', confirmPassword: '' };
const resetSchema = {
  password: Joi.string().label('Password').ruleset.pattern(/^(?=.*[a-z])(?=.*[0-9])(?=.{8,})/).max(30).message('Password needs to have a minimum length of 8, at least one letter and one number.'),
  confirmPassword: Joi.string().label('Confirmation password').required().valid(Joi.ref('password')).messages({ 'any.only': 'Confirmation password must be the same as the password' }),
};

export const ResetPasswordForm = memo(({ location }) => {
  const {
    id, token, username, error,
  } = useUrlParams(location.search);
  const { fields: { password, confirmPassword }, submit, loading } = useFieldset({ schema: resetSchema, source: resetForm });

  useEffect(() => {
    window.location = `${window.__ENVIRONMENT__.APP_SCHEME_PREFIX}/auth/reset?${queryString.stringify({ token, username })}`;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!id || !token || !username) {
    return (<Redirect to='/' />);
  }

  return (
    <div className='reset-password-form flex flex-column min-vh-100 w-100 pa3'>
      <Helmet title='Choose your new password' />
      <Grid textAlign='center' className='flex-auto' verticalAlign='middle'>
        <Grid.Column style={{ maxWidth: 450 }}>
          <Image src={window.__ENVIRONMENT__.APP_LOGO_URL} alt='logo' size='medium' className='center mb4' />
          <Form error={!!error} onSubmit={submit} method='POST' action={`${window.__ENVIRONMENT__.APP_URL}${window.__ENVIRONMENT__.PARSE_PATH}/apps/${id}/request_password_reset`}>
            <Segment stacked>
              <Message error header='Error' content={error} className='tl' />
              <Form.Field error={password.errored}>
                <Popup message={password.message} enabled={password.errored}>
                  <Input fluid icon='lock' iconPosition='left' type='password' name='new_password' placeholder='New password' value={password.value} onChange={password.onChange} autoComplete='new-password' />
                </Popup>
              </Form.Field>
              <Form.Field error={confirmPassword.errored}>
                <Popup message={confirmPassword.message} enabled={confirmPassword.errored}>
                  <Input fluid icon='lock' iconPosition='left' type='password' placeholder='Confirm your new password' value={confirmPassword.value} onChange={confirmPassword.onChange} autoComplete='new-password' />
                </Popup>
              </Form.Field>
              <Button type='submit' disabled={loading} loading={loading} primary fluid size='large'>Set new password</Button>
              <input name='username' type='hidden' value={username} />
              <input name='token' type='hidden' value={token} />
            </Segment>
          </Form>
          <Message>
            Here by accident?
            {' '}
            <Link to='/'>Click here</Link>
          </Message>
        </Grid.Column>
      </Grid>
      <div className='mt3 justify-between flex-wrap flex'>
        <div className='mr3'>
          Build:
          <span className='b'>{window.__ENVIRONMENT__.BUILD}</span>
          {' '}
          Environment:
          {' '}
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
