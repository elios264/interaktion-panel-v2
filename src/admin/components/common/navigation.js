import _ from 'lodash';
import moment from 'moment';
import React from 'react';
import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';
import { NavLink, Link } from 'react-router-dom';
import { Icon, Menu, Image, Loader, Label, List } from 'semantic-ui-react';

import { Popup } from 'controls';

const emptyResource = {};

export const Navigation = ({ children }) => {
  const { isWorking, workingMessages } = useSelector((state) => state.siteInfo);
  const userInfo = useSelector((state) => state.userInfo);
  const userPhotoResource = useSelector((state) => state.objects.resources[_.get(state.userInfo.photo, 'id')] || emptyResource);

  return (
    <div className='min-vh-100 relative'>
      <Menu vertical fixed='left' color='blue' className='flex-important' style={{ overflowY: 'auto' }}>
        <Menu.Item as={Link} to='/'>
          <Image size='small' src={window.__ENVIRONMENT__.APP_LOGO_URL} className='center' />
        </Menu.Item>
        <Menu.Item as={Link} to={`/managers/details/${userInfo.id}`} name='profile' className='flex-important items-center'>
          <Image avatar src={userPhotoResource.fileUrl || require('img/empty.png')} />
          <span className='ml2'>{userInfo.name}</span>
        </Menu.Item>
        <Menu.Item>
          <Icon name='users' />
          Management
          <Menu.Menu>
            <Menu.Item as={NavLink} to='/managers' name='managers'>
              Managers
            </Menu.Item>
          </Menu.Menu>
        </Menu.Item>
        <Menu.Item as={NavLink} to='/logbook' name='logbook'>
          <Icon name='book' />
          Logbook
        </Menu.Item>
        <Menu.Item className='f6 mt-auto'>
          <div>
            <div className='bb mb2 pb2 b--light-silver'>
              Build: <span className='b'>{window.__ENVIRONMENT__.BUILD}</span>
              <br />Environment: <span className='b'>{window.__ENVIRONMENT__.BUILD_ENVIRONMENT}</span>
            </div>
            Developed with <Icon name='like' color='red' /> by
            <br /><a className='pointer' href='mailto:elios264@outlook.com' rel='noopener noreferrer' target='_blank'>elios264.</a><br />
            ©{moment().format('YYYY')} all rights reserved.
          </div>
        </Menu.Item>
      </Menu>
      <div style={{ marginLeft: '15rem' }}>
        {children}
      </div>
      {!!isWorking && (
        <Popup
          flowing
          position='bottom right'
          popperDependencies={[workingMessages]}
          message={<List bulleted>{_.map(workingMessages, (message, key) => (<List.Item key={key}>{message}</List.Item>))}</List>}>
          <Label size='large' color='blue' corner='right' style={{ position: 'fixed' }}>
            <Loader active inline='centered' size='tiny' inverted className='icon pointer' />
          </Label>
        </Popup>
      )}
    </div>
  );
};

Navigation.propTypes = {
  children: PropTypes.node.isRequired,
};
