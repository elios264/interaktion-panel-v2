import _ from 'lodash';
import { useMemo, useCallback, useState } from 'react';
import { Helmet } from 'react-helmet';
import {
  Menu, Input, Segment, Button, Modal, Dropdown,
} from 'semantic-ui-react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';

import { Content, ContentDefinition } from 'objects';
import { LoadingDots, AwaitableDropdownItem } from 'controls';
import {
  VirtualTable, Column, dateRenderer, labelRenderer,
} from 'controls/table';
import {
  useUrlParams, useUrlParamsHandler, useAsyncSubmit, useDispatchCallback,
} from 'controls/hooks';
import { useResourceImageRenderer } from 'admin/hooks';
import { deleteSelectedContents, exportContents, importContents } from 'admin/actions/contents';
import { deleteContentDefinition } from 'admin/actions/contentsDefinitions';

const linkRenderer = ({ cellData, rowData }) => <Link to={`/contents/${rowData.definition.id}/details/${rowData.id}`}>{cellData}</Link>; // eslint-disable-line react/prop-types
const visibilityRenderer = ({ cellData }) => labelRenderer({ cellData: Content.getVisibilityName(cellData), columnData: { color: Content.getVisibilityColor(cellData) } });

export const ContentList = ({ match, location, history }) => {
  const isWorking = useSelector((state) => state.siteInfo.isWorking);
  const resourceImageRenderer = useResourceImageRenderer();
  const [selectedContents, setSelectedContents] = useState([]);

  const resources = useSelector((state) => state.objects.resources);
  const definition = useSelector((state) => state.objects.contentDefinitions[match.params.definitionId]);
  const contents = useSelector((state) => state.objects.contents);
  const definitionContents = useMemo(() => _.filter(contents, (content) => content.definition.id === _.get(definition, 'id')), [definition, contents]);

  const defaultParams = useMemo(() => ({
    sortBy: _.get(definition, 'sortContentsBy', ContentDefinition.sortContentsBy.createdAt),
    sortDir: _.get(definition, 'sortContentsBy', ContentDefinition.sortContentsBy.createdAt) === ContentDefinition.sortContentsBy.order ? 'asc' : 'desc',
    search: '',
  }), [definition]);
  const urlParams = useUrlParams(location.search, defaultParams);
  const onSortChange = useUrlParamsHandler({ history, location });
  const onSearchChange = useUrlParamsHandler({ history, location, key: 'search' });

  const getImageUrl = useCallback(({ cellData }) => _.get(resources[_.get(cellData, 'id')], 'fileUrl'), [resources]); // so export the file url works.

  const deleteSelectedContentsAndClearSelection = useAsyncSubmit(useDispatchCallback(deleteSelectedContents, selectedContents), () => setSelectedContents([]));
  const deleteContentDefinitionAndGoToCreatePage = useAsyncSubmit(useDispatchCallback(deleteContentDefinition, definition), () => history.replace('/contents/create'));
  const exportToJSON = useDispatchCallback(exportContents, { definition, contentsIds: _.isEmpty(selectedContents) ? undefined : selectedContents });
  const importFromJSON = useDispatchCallback(importContents, { definition });

  if (!definition) {
    return (
      <Modal dimmer='blurring' open size='tiny'>
        <Modal.Header content={isWorking ? 'Loading section contents' : 'Section not found'} />
        <Modal.Content content={isWorking ? <LoadingDots prefix='We are getting the info you requested' /> : 'We could not locate the specified section.'} />
        <Modal.Actions>
          <Button as={Link} to='/contents/create' primary icon='external' labelPosition='right' content='Create it!' />
        </Modal.Actions>
      </Modal>
    );
  }

  return (
    <section className='content-list'>
      <Helmet title={`${definition.title[window.__ENVIRONMENT__.APP_LOCALE]} | Contents`} />
      <Menu attached stackable className='sticky-ns z-1'>
        <Menu.Item>
          <Button fluid color='teal' as={Link} to={`/contents/${definition.id}/create`} icon='content' content='New content' />
        </Menu.Item>
        <Dropdown item icon='tasks' simple>
          <Dropdown.Menu>
            <Dropdown.Header content='Tasks' />
            <AwaitableDropdownItem
              icon='trash'
              onClick={deleteSelectedContentsAndClearSelection}
              disabled={selectedContents.length === 0}
              text='Delete selection'
            />
            <Dropdown.Header content='Section' />
            <Dropdown.Item as={Link} to={`/contents/${definition.id}/edit`} icon='edit' text='Modify...' />
            <AwaitableDropdownItem onClick={deleteContentDefinitionAndGoToCreatePage} icon='trash' text='Delete...' />
            <Dropdown.Header content='Data' />
            <AwaitableDropdownItem onClick={exportToJSON} icon='file archive outline' text='Export (.json)' />
            <AwaitableDropdownItem onClick={importFromJSON} icon='file archive outline' text='Import (.json)' />
          </Dropdown.Menu>
        </Dropdown>
        <Menu.Item position='right' className='w-50-m w-33-l'>
          <Input icon='search' placeholder='Search...' transparent value={urlParams.search} onChange={onSearchChange} />
        </Menu.Item>
      </Menu>
      <div className='pa2'>
        <Segment raised>
          <VirtualTable
            source={definitionContents}
            minWidth={900}
            showSelection
            onSelectionChange={setSelectedContents}
            selectedRows={selectedContents}
            sortSearchParams={urlParams}
            onSortChange={onSortChange}
          >
            <Column
              dataKey='image'
              label='Image'
              width={60}
              flexGrow={1}
              maxWidth={100}
              disableSort
              disableSearch
              columnData={{ rounded: true, size: 'mini' }}
              cellRenderer={resourceImageRenderer}
              searchKey={getImageUrl}
            />
            <Column
              dataKey={`title[${window.__ENVIRONMENT__.APP_LOCALE}]`}
              label='Title'
              width={250}
              flexGrow={1}
              maxWidth={350}
              searchKey={`title[${window.__ENVIRONMENT__.APP_LOCALE}]`}
              cellRenderer={linkRenderer}
            />
            <Column
              label='Visibility'
              dataKey='visibility'
              width={140}
              flexGrow={1}
              maxWidth={250}
              cellRenderer={visibilityRenderer}
            />
            <Column
              label='Type'
              dataKey='entityTypeName'
              width={140}
              flexGrow={1}
              maxWidth={250}
              columnData={{ color: 'orange' }}
              cellRenderer={labelRenderer}
            />
            <Column
              label='Updated'
              dataKey='updatedAt'
              width={140}
              flexGrow={1}
              maxWidth={250}
              cellRenderer={dateRenderer}
            />
            <Column
              label='Created'
              dataKey='createdAt'
              width={140}
              flexGrow={1}
              maxWidth={250}
              cellRenderer={dateRenderer}
            />
            {definition.sortContentsBy === ContentDefinition.sortContentsBy.order && (
              <Column
                label='Order'
                dataKey='order'
                width={140}
              />
            )}
          </VirtualTable>
        </Segment>
      </div>
    </section>
  );

};
