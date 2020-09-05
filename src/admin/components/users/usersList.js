import _ from 'lodash';
import React, { useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { Menu, Input, Segment, Button } from 'semantic-ui-react';
import { Helmet } from 'react-helmet';

import { User } from 'objects';
import { useUrlParams, useUrlParamsHandler } from 'controls/hooks';
import { VirtualTable, Column, dateRenderer } from 'controls/table';
import { useResourceImageRenderer } from 'admin/hooks';
import { CreateUserModal } from './createUserModal';


const linkRenderer = ({ cellData, rowData }) => <Link to={`/users/details/${rowData.id}`}>{cellData}</Link>; // eslint-disable-line react/prop-types
const defaultParams = { sortBy: 'lastActivity', sortDir: 'desc', search: '' };

export const UsersList = ({ match, location, history }) => {
  const isCreating = match.params.action === 'create';

  const resourceImageRenderer = useResourceImageRenderer();

  const users = useSelector((state) => state.objects.users);
  const clients = useMemo(() => _.filter(users, ['role', User.role.client]), [users]);

  const resources = useSelector((state) => state.objects.resources);
  const urlParams = useUrlParams(location.search, defaultParams);
  const onSortChange = useUrlParamsHandler({ history, location });
  const onSearchChange = useUrlParamsHandler({ history, location, key: 'search' });
  const switchToListingMode = useCallback(() => history.replace(`/users${location.search}`), [history, location]);
  const getImageUrl = useCallback(({ cellData }) => _.get(resources[_.get(cellData, 'id')], 'fileUrl'), [resources]); // so export the file url works.


  return (
    <section className='users-list'>
      <Helmet title='Users listing' />
      <Menu attached stackable className='sticky-ns z-1'>
        <Menu.Item>
          <Button fluid color='teal' as={Link} to={`/users/create${location.search}`} icon='add user' content='New user' />
        </Menu.Item>
        <Menu.Item position='right' className='w-50-m w-33-l'>
          <Input icon='search' placeholder='Search...' transparent value={urlParams.search} onChange={onSearchChange} />
        </Menu.Item>
      </Menu>
      { isCreating && <CreateUserModal onCancel={switchToListingMode} /> }
      <div className='pa2'>
        <Segment raised>
          <VirtualTable
            source={clients}
            minWidth={900}
            sortSearchParams={urlParams}
            onSortChange={onSortChange}>
            <Column
              dataKey='photo'
              label='Avatar'
              width={60}
              flexGrow={1}
              maxWidth={100}
              disableSort
              disableSearch
              columnData={{ rounded: true, size: 'mini' }}
              cellRenderer={resourceImageRenderer}
              searchKey={getImageUrl} />
            <Column
              dataKey='name'
              label='Name'
              width={200}
              flexGrow={1}
              maxWidth={350}
              searchKey='name'
              cellRenderer={linkRenderer} />
            <Column
              dataKey='email'
              label='Email'
              width={200}
              flexGrow={1}
              maxWidth={350} />
            <Column
              label='Last activity'
              dataKey='lastActivity'
              width={140}
              flexGrow={1}
              maxWidth={250}
              cellRenderer={dateRenderer} />
            <Column
              label='Created'
              dataKey='createdAt'
              width={140}
              flexGrow={1}
              maxWidth={250}
              cellRenderer={dateRenderer} />
          </VirtualTable>
        </Segment>
      </div>
    </section>
  );
};
