import _ from 'lodash';
import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { Segment, Header, Icon, Button, Grid, Image, Message } from 'semantic-ui-react';
import { sortableContainer, sortableElement, sortableHandle } from 'react-sortable-hoc';
import Joi from 'joi';

import { useFieldset, useDispatchCallback } from 'controls/hooks';
import { saveContentDefinitionsOrders } from 'admin/actions/settings';

const arrayMove = (array, from, to) => {
  array = array.slice();
  const startIndex = to < 0 ? array.length + to : to;
  // eslint-disable-next-line prefer-destructuring
  const item = array.splice(from, 1)[0];
  array.splice(startIndex, 0, item);
  return array;
};


const contentDefinitionsOrderSchema = { contentDefinitions: Joi.array().required() };
export const ContentDefinitionsOrder = () => {

  const contentDefinitionsStore = useSelector((state) => state.objects.contentDefinitions);
  const contentDefinitionsWrapper = useMemo(() => ({ contentDefinitions: _.sortBy(contentDefinitionsStore, 'order') }), [contentDefinitionsStore]);

  const { fields: { contentDefinitions }, submit, loading, reset } = useFieldset({
    schema: contentDefinitionsOrderSchema,
    onSubmit: useDispatchCallback(saveContentDefinitionsOrders),
    source: contentDefinitionsWrapper,
  });
  const onSortEnd = ({ oldIndex, newIndex }) => contentDefinitions.onChange(arrayMove(contentDefinitions.value, oldIndex, newIndex));

  return (
    <Segment raised>
      <div className='pa2'>
        <div className='mb4'>
          <Header
            content='Sections order'
            size='large'
            subheader='Configure the order in which the section tiles appear in the mobile app'
            icon='ordered list' />
        </div>
        <Grid>
          <Grid.Column>
            {_.size(contentDefinitions.value) ?
              <SortableList axis='y' lockAxis='y' items={contentDefinitions.value} onSortEnd={onSortEnd} useDragHandle /> :
              <Message warning content='Created sections will appear here so you can determine the order on which they will be displayed.' />
            }
          </Grid.Column>
        </Grid>
        <div className='tr mt3'>
          <Button
            type='button'
            className='w-100 w-auto-ns'
            secondary
            disabled={loading || !_.size(contentDefinitions.value)}
            loading={loading}
            onClick={reset}
            icon='cancel'
            content='Cancel' />
          <div className='db mt1 di-ns mt0-ns' />
          <Button
            onClick={submit}
            disabled={loading || !_.size(contentDefinitions.value)}
            loading={loading}
            className='w-100 w-auto-ns'
            primary
            icon='edit'
            content='Save' />
        </div>
      </div>
    </Segment>
  );
};

const DragHandle = sortableHandle(() => <span className='pl2' style={{ cursor: 'row-resize' }}><Icon name='bars' /></span>);
const SortableItem = sortableElement(({ item: { id, title, image, enabled } }) => {
  const thumbUrl = useSelector((state) => _.get(state.objects.resources[image.id], 'thumb'));
  return (
    <Segment className='flex-row' secondary={!enabled}>
      <DragHandle />
      <Image inline src={thumbUrl || require('img/empty.png')} rounded size='mini' className='mh3' />
      <Link to={`/contents/${id}`}>{title[window.__ENVIRONMENT__.APP_LOCALE]}</Link>
    </Segment>
  );
});
const SortableList = sortableContainer(({ items }) => (
  <Segment.Group style={{ maxHeight: 800, overflowY: 'auto' }}>
    {_.map(items, (item, index) => (
      <SortableItem key={item.id} index={index} item={item} />
    ))}
  </Segment.Group>
));
