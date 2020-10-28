import _ from 'lodash';
import { Fragment, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import {
  Segment, Header, Icon, Button, Grid, Message, Dropdown,
} from 'semantic-ui-react';
import { sortableContainer, sortableElement, sortableHandle } from 'react-sortable-hoc';
import Joi from 'joi';

import { Page } from 'objects';
import { useFieldset, useDispatchCallback } from 'controls/hooks';
import { savePagesOrder } from 'admin/actions/settings';
import { exportPages, importPages } from 'admin/actions/pages';

const arrayMove = (array, from, to) => {
  array = array.slice();
  const startIndex = to < 0 ? array.length + to : to;
  // eslint-disable-next-line prefer-destructuring
  const item = array.splice(from, 1)[0];
  array.splice(startIndex, 0, item);
  return array;
};

const pagesOrderSchema = { pages: Joi.array().required() };
export const PagesOrder = () => {

  const pagesStore = useSelector((state) => state.objects.pages);
  const pagesWrapper = useMemo(() => ({ pages: _.sortBy(pagesStore, 'order') }), [pagesStore]);

  const exportToJSON = useDispatchCallback(exportPages);
  const importFromJSON = useDispatchCallback(importPages);

  const {
    fields: { pages }, submit, loading, reset,
  } = useFieldset({
    schema: pagesOrderSchema,
    onSubmit: useDispatchCallback(savePagesOrder),
    source: pagesWrapper,
  });
  const onSortEnd = ({ oldIndex, newIndex }) => pages.onChange(arrayMove(pages.value, oldIndex, newIndex));

  return (
    <Segment raised>
      <div className='pa2'>
        <div className='mb4'>
          <Header
            content='Pages order'
            size='large'
            subheader='Configure the order in which the pages tiles appear in the mobile app'
            icon='ordered list'
          />
        </div>
        <Grid>
          <Grid.Column>
            {_.size(pages.value)
              ? <SortableList axis='y' lockAxis='y' items={pages.value} onSortEnd={onSortEnd} useDragHandle />
              : <Message warning content='Created pages will appear here so you can determine the order on which they will be displayed.' />}
          </Grid.Column>
        </Grid>
        <div className='mt3 flex-l flex-row justify-between'>
          <div className='db di-l'>
            <Button.Group color='green' className='w-100 w-auto-l'>
              <Button
                type='button'
                icon='file archive outline'
                onClick={exportToJSON}
                content='Export pages (.json)'
              />
              <Dropdown
                className='button icon flex-none-important'
                floating
                options={[{
                  key: 'import', active: false, icon: 'file archive outline', text: 'Import pages (.json)', value: 'pages', onClick: importFromJSON,
                }]}
                trigger={<></>}
              />
            </Button.Group>
          </div>
          <div className='db mt1 di-l mt0-l'>
            <Button
              type='button'
              className='w-100 w-auto-l'
              secondary
              disabled={loading || !_.size(pages.value)}
              loading={loading}
              onClick={reset}
              icon='cancel'
              content='Cancel'
            />
            <div className='db mt1 di-l mt0-l' />
            <Button
              onClick={submit}
              disabled={loading || !_.size(pages.value)}
              loading={loading}
              className='w-100 w-auto-l'
              primary
              icon='edit'
              content='Save'
            />
          </div>
        </div>
      </div>
    </Segment>
  );
};

const DragHandle = sortableHandle(() => <span className='pl2' style={{ cursor: 'row-resize' }}><Icon name='bars' /></span>);
const SortableItem = sortableElement(({
  item: {
    id, title, visibility,
  },
}) => (
  <Segment className='flex-row' secondary={visibility === Page.visibility.none}>
    <DragHandle />
    <Link className='mh3' to={`/pages/${id}`}>{title[window.__ENVIRONMENT__.APP_LOCALE]}</Link>
  </Segment>
));
const SortableList = sortableContainer(({ items }) => (
  <Segment.Group style={{ maxHeight: 800, overflowY: 'auto' }}>
    {_.map(items, (item, index) => (
      <SortableItem key={item.id} index={index} item={item} />
    ))}
  </Segment.Group>
));
