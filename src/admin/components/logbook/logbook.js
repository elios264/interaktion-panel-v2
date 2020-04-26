import _ from 'lodash';
import React, { useRef, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { Menu, Input, Dropdown, Segment, Header, Icon, Divider } from 'semantic-ui-react';
import { Helmet } from 'react-helmet';

import { utils } from 'controls';
import { VirtualTable, Column, dateRenderer, labelRenderer } from 'controls/table';
import { useUrlParams, useUrlParamsHandler } from 'controls/hooks';

const actionDefinitions = {
  'login-user': { desc: () => 'Has logged in' },
  'logout-user': { desc: () => 'Has logged out' },
  'update-profile': { desc: () => 'Has updated their profile' },
  'create-user': { desc: ({ email }) => `Has created a manager with email ${email}` },
  'delete-user': { desc: ({ email }) => `Has deleted a manager with email ${email}` },
  'reset-password-user': { desc: ({ email }) => `Has sent a password reset email to the manager with email ${email}` },


};

const eventRenderer = ({ rowData }) => {
  const { eventName, dimensions } = rowData;
  const definition = actionDefinitions[eventName];
  return _.invoke(definition, 'desc', dimensions) || `Has performed the action: ${eventName}`;
};

const defaultParams = { sortBy: 'timestamp', sortDir: 'desc', search: '' };


export const Logbook = ({ location, history }) => {

  const eventLogs = useSelector((state) => state.objects.eventLogs);
  const managers = useSelector((state) => state.objects.users);

  const tableRef = useRef();
  const urlParams = useUrlParams(location.search, defaultParams);
  const onSortChange = useUrlParamsHandler({ history, location });
  const onSearchChange = useUrlParamsHandler({ history, location, key: 'search' });

  const exportToExcel = () => {
    const blob = utils.arrayToXLSXBlob(tableRef.current.getAsDataArray(), 'Logbook');
    utils.downloadBlob(blob, `Logbook at ${utils.formatDate()}.xlsx`);
  };

  const userSearch = useCallback(({ rowData: { userId } }) => _.get(managers[userId], 'name', userId), [managers]);
  const userRenderer = useCallback(({ rowData, ...extra }) => labelRenderer({ ...extra, cellData: userSearch({ rowData }) }), [userSearch]);

  return (
    <section className='logbook-list'>
      <Helmet title='Logbook' />
      <Menu attached stackable className='sticky-ns z-1'>
        <Dropdown item icon='tasks' simple>
          <Dropdown.Menu>
            <Dropdown.Header content='Data' />
            <Dropdown.Item onClick={exportToExcel} icon='file excel outline' text='Export (.xlsx)' />
          </Dropdown.Menu>
        </Dropdown>
        <Menu.Item position='right' className='w-50-m w-33-l'>
          <Input icon='search' placeholder='Search...' transparent value={urlParams.search} onChange={onSearchChange} />
        </Menu.Item>
      </Menu>
      <div className='pa2'>
        <Segment raised>
          <Header as='h2'>
            <Icon name='book' />
            <Header.Content>
              Logbook
              <Header.Subheader>Here you can view all the operations that have been performed in the admin panel for the last 12 months.</Header.Subheader>
            </Header.Content>
          </Header>
          <Divider hidden />
          <VirtualTable
            ref={tableRef}
            source={eventLogs}
            minWidth={700}
            sortSearchParams={urlParams}
            onSortChange={onSortChange}>
            <Column
              dataKey='manager'
              label='Manager'
              width={100}
              flexGrow={1}
              maxWidth={200}
              columnData={{ color: 'blue' }}
              searchKey={userSearch}
              cellRenderer={userRenderer} />
            <Column
              dataKey='event'
              label='Event'
              width={200}
              flexGrow={3}
              cellRenderer={eventRenderer} />
            <Column
              dataKey='timestamp'
              label='Date'
              width={200}
              cellRenderer={dateRenderer} />
          </VirtualTable>
        </Segment>
      </div>
    </section>
  );
};
