import _ from 'lodash';
import { useCallback } from 'react';
import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import {
  Grid, Menu, Modal, Button, Segment, Form, Divider, Message, Input, Dropdown, Label,
} from 'semantic-ui-react';
import { Helmet } from 'react-helmet';

import { Content, ContentDefinition } from 'objects';
import { ResourceImageSelector } from 'admin/components/common';
import { useFieldset, useAsyncSubmit, useDispatchCallback } from 'controls/hooks';
import {
  Popup, LoadingDots, Selector, AwaitableButton, MultiLanguageInput, MultiLanguageTextArea, RichTextEditor, DatePicker, utils, AwaitableDropdownItem,
} from 'controls';

import { saveResource } from 'admin/actions/resources';
import { saveContent, deleteContent, cloneContent } from 'admin/actions/contents';
import { contentSchema, entityTypeContentSchema, entityTypeEventSchema } from './contentSchema';

const visibilityOptions = _.map(Content.visibility, (value, key) => ({ key, value, text: Content.getVisibilityName(value) }));
const entityTypeOptions = _.map(Content.entityType, (value, key) => ({ key, value, text: Content.getEntityTypeName(value) }));

const contentTemplate = new Content({
  order: 0,
  visibility: Content.visibility.public,
  entityType: Content.entityType.content,
});

const EntityInfoContent = () => null;
const EntityInfoEvent = ({ location, start, disabled }) => (
  <Form.Group widths='equal'>
    <Form.Field error={location.errored} required>
      <label>Location</label>
      <Popup message={location.message} enabled={location.errored}>
        <Input value={location.value || ''} onChange={location.onChange} autoComplete='off' disabled={disabled} />
      </Popup>
    </Form.Field>
    <Form.Field error={start.errored} required>
      <label>Start date</label>
      <Popup message={start.message} enabled={start.errored}>
        <DatePicker value={start.value} onChange={start.onChange} disabled={disabled} time />
      </Popup>
    </Form.Field>
  </Form.Group>
);
EntityInfoEvent.propTypes = {
  start: PropTypes.object.isRequired,
  location: PropTypes.object.isRequired,
  disabled: PropTypes.bool,
};

export const ContentDetails = ({ history, match }) => {

  const isEditing = match.params.action === 'edit';
  const isCreating = match.params.action === 'create';

  const isWorking = useSelector((state) => state.siteInfo.isWorking);
  const content = useSelector((state) => state.objects.contents[match.params.contentId]);
  const contentDefinition = useSelector((state) => state.objects.contentDefinitions[match.params.definitionId]);
  const resources = useSelector((state) => state.objects.resources);

  const saveRes = useDispatchCallback(saveResource);
  const switchToDetailsMode = (newContent) => history.replace(`/contents/${match.params.definitionId}/details/${(newContent instanceof Content) ? newContent.id : content.id}`);
  const saveContentAndGoToDetails = useAsyncSubmit(useDispatchCallback(saveContent), switchToDetailsMode);
  const deleteContentAndGoToListing = useAsyncSubmit(useDispatchCallback(deleteContent, content), () => history.replace(`/contents/${match.params.definitionId}`));
  const cloneContentAndGoToDetails = useAsyncSubmit(useDispatchCallback(cloneContent, content), switchToDetailsMode);

  const cloneSourceContent = useCallback((contentToClone) => {
    const clonedContent = contentToClone.copy();
    clonedContent.definition = contentDefinition;
    return clonedContent;
  }, [contentDefinition]);

  const {
    fields, submit, loading, reset, validator,
  } = useFieldset({
    schema: contentSchema,
    enabled: isEditing || isCreating,
    onSubmit: saveContentAndGoToDetails,
    source: content || contentTemplate,
    cloneSource: cloneSourceContent,
  });
  const {
    image, document, visibility, entityType, entityInfo, title, description, order,
  } = fields;

  const { fields: entityInfoFields } = useFieldset({
    validator,
    source: entityInfo.value,
    onSubmit: entityInfo.onChange,
    schema: utils.getValue(entityType.value, { [Content.entityType.content]: entityTypeContentSchema, [Content.entityType.event]: entityTypeEventSchema }),
    enabled: isEditing || isCreating,
  });

  const EntityInfoFields = utils.getValue(entityType.value, {
    [Content.entityType.content]: EntityInfoContent,
    [Content.entityType.event]: EntityInfoEvent,
  });

  if (!contentDefinition || (!isCreating && !content)) {
    return (
      <Modal dimmer='blurring' open size='tiny'>
        <Modal.Header content={isWorking ? 'Loading content details' : 'Content not found'} />
        <Modal.Content content={isWorking ? <LoadingDots prefix='We are getting the info you requested' /> : 'We could not locate the specified content.'} />
        <Modal.Actions>
          <Button as={Link} to='/' primary icon='external' labelPosition='right' content='Go back to main page...' />
        </Modal.Actions>
      </Modal>
    );
  }

  return (
    <section className='content-details'>
      <Helmet title={`${_.get(content, `title[${window.__ENVIRONMENT__.APP_LOCALE}]`, 'New')} | Content`} />
      <Menu attached stackable className='sticky-ns z-1'>
        {!isCreating && (
          <Menu.Item>
            <Button disabled={isEditing} as={Link} to={`/contents/${contentDefinition.id}/details/${content.id}/edit`} replace fluid color='yellow' icon='edit' content='Edit' />
          </Menu.Item>
        )}
        {!isCreating && (
          <Menu.Item>
            <AwaitableButton disabled={isEditing} fluid icon='trash' negative content='Delete' onClick={deleteContentAndGoToListing} />
          </Menu.Item>
        )}
        {!isEditing && !isCreating && (
          <Dropdown item icon='tasks' simple>
            <Dropdown.Menu>
              <Dropdown.Header content='Tasks' />
              <AwaitableDropdownItem icon='copy' text='Clone' disabled={isEditing} onClick={cloneContentAndGoToDetails} />
            </Dropdown.Menu>
          </Dropdown>
        )}
        <Menu.Item position='right'>
          <Button as={Link} to={`/contents/${contentDefinition.id}`} icon='external' fluid content='Back to listing' />
        </Menu.Item>
      </Menu>
      <div className='pa2'>
        <Segment raised>
          <Form onSubmit={submit}>
            <Grid centered divided stackable>
              <Grid.Column computer={16} largeScreen={8} widescreen={8}>
                <Grid.Row>
                  <Form.Field error={title.errored} required>
                    <label>Title</label>
                    <Popup message={title.message} enabled={title.errored}>
                      <MultiLanguageInput value={title.value} onChange={title.onChange} autoComplete='off' disabled={!isEditing && !isCreating} />
                    </Popup>
                  </Form.Field>
                  <Form.Group widths='equal'>
                    <Form.Field error={visibility.errored}>
                      <label>Visibility</label>
                      <Popup message={visibility.message} enabled={visibility.errored}>
                        <Selector
                          disabled={!isEditing && !isCreating}
                          options={visibilityOptions}
                          value={visibility.value}
                          onChange={visibility.onChange}
                        />
                      </Popup>
                    </Form.Field>
                    <Form.Field error={entityType.errored}>
                      <label>Type</label>
                      <Popup message={entityType.message} enabled={entityType.errored}>
                        <Selector
                          disabled={!isEditing && !isCreating}
                          options={entityTypeOptions}
                          value={entityType.value}
                          onChange={entityType.onChange}
                        />
                      </Popup>
                    </Form.Field>
                  </Form.Group>
                  <EntityInfoFields {...entityInfoFields} disabled={!isEditing && !isCreating} />
                  <Grid stackable columns={2}>
                    <Grid.Row stretched>
                      <Grid.Column>
                        <Form.Field error={image.errored} required>
                          <label>
                            Image
                            <span className='i silver ml2'>Recommended aspect ratio: 3:2</span>
                          </label>
                          <Popup message={image.message} enabled={image.errored}>
                            <ResourceImageSelector
                              disabled={!isEditing && !isCreating}
                              value={image.value}
                              onChange={image.onChange}
                            />
                          </Popup>
                        </Form.Field>
                      </Grid.Column>
                      <Grid.Column>
                        {contentDefinition.sortContentsBy === ContentDefinition.sortContentsBy.order && (
                          <Form.Field error={order.errored} required style={{ flexGrow: 0 }}>
                            <label>Order</label>
                            <Popup message={order.message} enabled={order.errored}>
                              <Input value={_.isUndefined(order.value) ? '' : order.value} onChange={order.onChange} autoComplete='off' type='number' min={0} max={9999} disabled={!isEditing && !isCreating} />
                            </Popup>
                          </Form.Field>
                        )}
                        <Form.Field error={description.errored} className='flex flex-column' required>
                          <label>Description</label>
                          <Popup message={description.message} enabled={description.errored}>
                            <MultiLanguageTextArea
                              className='w-100 flex-auto'
                              style={{ resize: 'none' }}
                              maxLength={1000}
                              value={description.value}
                              onChange={description.onChange}
                              rows={5}
                              disabled={!isEditing && !isCreating}
                              placeholder='Short description.'
                            />
                          </Popup>
                        </Form.Field>
                      </Grid.Column>
                    </Grid.Row>
                  </Grid>
                </Grid.Row>
                <Divider hidden />
                <Divider />
                {(!isCreating && !isEditing) && (
                  <Grid.Row className='mt3 flex justify-around flex-wrap flex-column flex-row-ns'>
                    <div className='ma1'><Label color='green' icon='calendar' content={`Created ${utils.formatDate(content.createdAt)}`} /></div>
                    <div className='ma1'><Label color='orange' icon='calendar' content={`Updated ${utils.formatDate(content.updatedAt)}`} /></div>
                  </Grid.Row>
                )}
                {(isEditing || isCreating) && (
                  <Grid.Row className='tr'>
                    <Button
                      type='button'
                      className='w-100 w-auto-ns'
                      secondary
                      disabled={loading}
                      loading={loading}
                      onClick={isCreating ? reset : switchToDetailsMode}
                      icon={isCreating ? 'repeat' : 'cancel'}
                      content={isCreating ? 'Start over' : 'Cancel'}
                    />
                    <div className='db mt1 di-ns mt0-ns' />
                    <Button
                      type='submit'
                      disabled={loading}
                      loading={loading}
                      className='w-100 w-auto-ns'
                      primary
                      icon='edit'
                      content={isCreating ? `Create ${_.toLower(Content.getEntityTypeName(entityType.value))}!` : 'Save'}
                    />
                  </Grid.Row>
                )}
              </Grid.Column>
              <Grid.Column computer={16} largeScreen={8} widescreen={8}>
                {document.errored && <Message negative content={document.message} /> }
                <RichTextEditor
                  value={document.value}
                  onChange={document.onChange}
                  disabled={!isEditing && !isCreating}
                  resources={resources}
                  saveResource={saveRes}
                  placeholder='Enter your text here...'
                />
              </Grid.Column>
            </Grid>
          </Form>
        </Segment>
      </div>
    </section>
  );
};
