import _ from 'lodash';
import React, { useRef, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { Menu, Input, Dropdown, Segment, Button } from 'semantic-ui-react';
import { Helmet } from 'react-helmet';

import { utils } from 'controls';
import { useUrlParams, useUrlParamsHandler } from 'controls/hooks';
import { VirtualTable, Column, dateRenderer } from 'controls/table';
import { useResourceImageRenderer } from 'admin/hooks';
import { CreateManagerModal } from './createManagerModal';


const linkRenderer = ({ cellData, rowData, columnData: { id } }) => <Link to={`/managers/details/${rowData.id}`}>{rowData.id === id ? `${cellData} (you)` : cellData}</Link>; // eslint-disable-line react/prop-types
const defaultParams = { sortBy: 'lastActivity', sortDir: 'desc', search: '' };

export const ManagersList = ({ match, location, history }) => {
  const isCreating = match.params.action === 'create';

  const tableRef = useRef();
  const resourceImageRenderer = useResourceImageRenderer();
  const me = useSelector((state) => state.userInfo);
  const managers = useSelector((state) => state.objects.users);
  const resources = useSelector((state) => state.objects.resources);
  const urlParams = useUrlParams(location.search, defaultParams);
  const onSortChange = useUrlParamsHandler({ history, location });
  const onSearchChange = useUrlParamsHandler({ history, location, key: 'search' });
  const switchToListingMode = useCallback(() => history.replace(`/managers${location.search}`), [history, location]);
  const getImageUrl = useCallback(({ cellData }) => _.get(resources[_.get(cellData, 'id')], 'fileUrl'), [resources]); // so export the file url works.

  const exportToExcel = useCallback(() => {
    const blob = utils.dataArrayAsXLSX(tableRef.current.getAsDataArray({ 'photo': true }), 'Managers listing');
    utils.downloadBlob(blob, `Managers at ${utils.formatDate()}.xlsx`);
  }, [tableRef]);

  return (
    <section className='manager-list'>
      <Helmet title='Managers listing' />
      <Menu attached stackable className='sticky-ns z-1'>
        <Menu.Item>
          <Button fluid color='teal' as={Link} to={`/managers/create${location.search}`} icon='add user' content='New manager' />
        </Menu.Item>
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
      { isCreating && <CreateManagerModal onCancel={switchToListingMode} /> }
      <div className='pa2'>
        <Segment raised>
          <VirtualTable
            ref={tableRef}
            source={managers}
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
              columnData={me}
              searchKey='name'
              cellRenderer={linkRenderer} />
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
