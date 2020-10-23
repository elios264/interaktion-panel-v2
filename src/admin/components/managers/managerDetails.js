import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import Joi from 'joi';
import { Grid, Menu, Modal, Button, Segment, Form, Header, Input } from 'semantic-ui-react';
import { Helmet } from 'react-helmet';

import { User } from 'objects';
import { Popup, utils, AwaitableButton, LoadingDots } from 'controls';
import { useFieldset, useAsyncSubmit, useDispatchCallback } from 'controls/hooks';
import { logout } from 'admin/actions/authentication';
import { updateProfile, deleteManager } from 'admin/actions/managers';
import { ResourceImageSelector } from 'admin/components/common';


const editManagerSchema = {
  name: Joi.string().trim().required().max(50).label('Name'),
  email: Joi.string().email({ tlds: { allow: false } }).required().max(50).label('Email'),
  photo: Joi.object().label('Profile pic'),
};

export const ManagerDetails = ({ match, history }) => {

  const dispatch = useDispatch();
  const isEditing = match.params.action === 'edit';
  const user = useSelector((state) => state.userInfo.id === match.params.userId ? state.userInfo : state.objects.users[match.params.userId]);
  const isOwnProfile = useSelector((state) => state.userInfo.id === match.params.userId);
  const isWorking = useSelector((state) => state.siteInfo.isWorking);

  const switchToDetailsMode = () => history.replace(`/managers/details/${user.id}`);
  const updateProfileAndGoToDetails = useAsyncSubmit(useDispatchCallback(updateProfile), switchToDetailsMode);

  const goToListing = () => history.replace('/managers');
  const deleteManagerAndGoToListing = useAsyncSubmit(useDispatchCallback(deleteManager, user), goToListing);

  const { fields: { name, photo, email }, submit, loading } = useFieldset({ schema: editManagerSchema, source: user, onSubmit: updateProfileAndGoToDetails, enabled: isEditing });

  if (!user || user.role !== User.role.admin) {
    return (
      <Modal dimmer='blurring' open size='tiny'>
        <Modal.Header content={isWorking ? 'Loading manager details' : 'Manager not found'} />
        <Modal.Content content={isWorking ? <LoadingDots prefix='We are getting the info you requested' /> : 'We could not locate the specified manager.'} />
        <Modal.Actions>
          <Button as={Link} to='/managers' primary icon='external' labelPosition='right' content='Go back to listing...' />
        </Modal.Actions>
      </Modal>
    );
  }

  return (
    <section className='manager-details'>
      <Helmet title={`${user.name} | Profile`} />
      <Menu attached stackable className='sticky-ns z-1'>

        { isOwnProfile ?
          <Menu.Item>
            <Button disabled={isEditing} as={Link} to={`/managers/details/${user.id}/edit`} replace fluid color='yellow' icon='edit' content='Edit' />
          </Menu.Item> :
          <Menu.Item>
            <AwaitableButton fluid icon='trash' negative content='Delete' onClick={deleteManagerAndGoToListing} />
          </Menu.Item>
        }
        <Menu.Item position='right'>
          { isOwnProfile
            ? <AwaitableButton icon='sign out' fluid content='Logout' negative onClick={() => dispatch(logout())} />
            : <Button as={Link} to='/managers' icon='external' fluid content='Back to listing' />
          }
        </Menu.Item>
      </Menu>
      <div className='pa2'>
        <Segment raised>
          <Form onSubmit={submit}>
            <Grid centered divided stackable>
              <Grid.Column computer={6} largeScreen={3} widescreen={3}>
                <ResourceImageSelector
                  disabled={!isEditing}
                  value={photo.value}
                  onChange={photo.onChange} />
              </Grid.Column>
              <Grid.Column computer={16} largeScreen={9} widescreen={9}>
                <Grid.Row>
                  <Form.Group widths='equal'>
                    <Form.Field error={name.errored} required>
                      <label>Full name</label>
                      <Popup message={name.message} enabled={name.errored}>
                        <Input value={name.value} onChange={name.onChange} autoComplete='off' disabled={!isEditing} />
                      </Popup>
                    </Form.Field>
                    <Form.Field error={email.errored} required>
                      <label>Email</label>
                      <Popup message={email.message} enabled={email.errored}>
                        <Input value={email.value} onChange={email.onChange} autoComplete='off' disabled={!isEditing} />
                      </Popup>
                    </Form.Field>
                  </Form.Group>
                </Grid.Row>
                {isEditing && (
                  <Grid.Row className='mt4 tr'>
                    <Button type='button' disabled={loading} loading={loading} onClick={switchToDetailsMode} className='w-100 w-auto-ns' secondary icon='cancel' content='Cancel' />
                    <div className='db mt1 di-ns mt0-ns' />
                    <Button disabled={loading} loading={loading} type='submit' className='w-100 w-auto-ns' primary icon='edit' content='Update' />
                  </Grid.Row>
                )}
              </Grid.Column>
              <Grid.Column computer={16} largeScreen={4} widescreen={4} className='flex-important flex-column justify-center'>
                <Header as='h2' icon='calendar outline' content={user.lastActivity ? utils.formatDate(user.lastActivity) : 'Never logged in'} subheader='Last activity' />
                <Header as='h2' icon='add user' content={utils.formatDate(user.createdAt)} subheader='Member since' />
              </Grid.Column>
            </Grid>
          </Form>
        </Segment>
      </div>
    </section>
  );

};
