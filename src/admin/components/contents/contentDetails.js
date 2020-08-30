import _ from 'lodash';
import React, { useCallback } from 'react';
import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { Grid, Menu, Modal, Button, Segment, Form, Divider, Message, Input } from 'semantic-ui-react';
import { Helmet } from 'react-helmet';
import Joi from '@hapi/joi';

import { Content } from 'objects';
import { ResourceImageSelector } from 'admin/components/common';
import { useFieldset, useAsyncSubmit, useDispatchCallback } from 'controls/hooks';
import { Popup, LoadingDots, Selector, AwaitableButton, getJoiLanguagesValidationSchema, MultiLanguageInput, MultiLanguageTextArea, RichTextEditor, DatePicker, utils } from 'controls';

import { saveContent } from 'admin/actions/contents';


const visibilityOptions = _.map(Content.visibility, (value, key) => ({ key, value, text: Content.getVisibilityName(value) }));
const entityTypeOptions = _.map(Content.entityType, (value, key) => ({ key, value, text: Content.getEntityTypeName(value) }));

const contentTemplate = new Content({
  visibility: Content.visibility.public,
  entityType: Content.entityType.content,
});

const entityTypeContentSchema = {};
const entityTypeEventSchema = {
  location: Joi.string().trim().required().max(200).label('Location'),
  start: Joi.object().instance(Date).required().label('Start date'),
};

const contentSchema = {
  image: Joi.object().required().label('Image'),
  visibility: Joi.string().valid(..._.values(Content.visibility)).label('Visibility'),
  entityType: Joi.string().valid(..._.values(Content.entityType)).label('Type'),
  entityInfo: Joi.any().when('entityType', {
    switch: [
      { is: Content.entityType.content, then: Joi.object().strip() },
      { is: Content.entityType.event, then: Joi.object(entityTypeEventSchema).pattern(/.*/, Joi.any().strip()).required() },
    ],
    otherwise: Joi.forbidden(),
  }),
  title: getJoiLanguagesValidationSchema('Title', 200),
  description: getJoiLanguagesValidationSchema('Description', 2000),
  documents: Joi.object({ [window.__ENVIRONMENT__.APP_LOCALE]: Joi.array().required().label('Content') }).pattern(/.*/, Joi.array().label('Content')).required().label('Content'),
};

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
      <label>Start</label>
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

  const switchToDetailsMode = (newContent) => history.replace(`/contents/${match.params.definitionId}/details/${(newContent instanceof Content) ? newContent.id : content.id}`);
  const saveContentAndGoToDetails = useAsyncSubmit(useDispatchCallback(saveContent), switchToDetailsMode);
  const deleteContentAndGoToListing = useAsyncSubmit(useDispatchCallback(_.noop, content), () => history.replace(`/contents/${match.params.definitionId}`));
  const cloneSourceContent = useCallback((content) => {
    const clonedContent = content.copy();
    clonedContent.definition = contentDefinition;
    return clonedContent;
  }, [contentDefinition]);

  const { fields, submit, loading, reset, validator } = useFieldset({
    schema: contentSchema,
    enabled: isEditing || isCreating,
    onSubmit: saveContentAndGoToDetails,
    source: content || contentTemplate,
    cloneSource: cloneSourceContent,
  });
  const { image, documents, visibility, entityType, entityInfo, title, description } = fields;

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
      <Helmet title={`${_.get(content, `[${window.__ENVIRONMENT__.APP_LOCALE}].title`, 'New')} | Content`} />
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
                          onChange={visibility.onChange} />
                      </Popup>
                    </Form.Field>
                    <Form.Field error={entityType.errored}>
                      <label>Type</label>
                      <Popup message={entityType.message} enabled={entityType.errored}>
                        <Selector
                          disabled={!isEditing && !isCreating}
                          options={entityTypeOptions}
                          value={entityType.value}
                          onChange={entityType.onChange} />
                      </Popup>
                    </Form.Field>
                  </Form.Group>
                  <EntityInfoFields {...entityInfoFields} disabled={!isEditing && !isCreating} />
                  <Grid stackable columns={2}>
                    <Grid.Row stretched>
                      <Grid.Column>
                        <Form.Field error={image.errored} required>
                          <label>Image<span className='i silver ml2'>Recommended aspect ratio: 3:2</span></label>
                          <Popup message={image.message} enabled={image.errored}>
                            <ResourceImageSelector
                              disabled={!isEditing && !isCreating}
                              value={image.value}
                              onChange={image.onChange} />
                          </Popup>
                        </Form.Field>
                      </Grid.Column>
                      <Grid.Column>
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
                              placeholder='Short description.' />
                          </Popup>
                        </Form.Field>
                      </Grid.Column>
                    </Grid.Row>
                  </Grid>
                </Grid.Row>
                <Divider hidden />
                <Divider />
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
                      content={isCreating ? 'Start over' : 'Cancel'} />
                    <div className='db mt1 di-ns mt0-ns' />
                    <Button
                      type='submit'
                      disabled={loading}
                      loading={loading}
                      className='w-100 w-auto-ns'
                      primary
                      icon='edit'
                      content={isCreating ? `Create ${_.toLower(Content.getEntityTypeName(entityType.value))}!` : 'Save'} />
                  </Grid.Row>
                )}
              </Grid.Column>
              <Grid.Column computer={16} largeScreen={8} widescreen={8}>
                {documents.errored && <Message negative content={documents.message} /> }
                <RichTextEditor
                  value={documents.value}
                  onChange={documents.onChange}
                  disabled={!isEditing && !isCreating}
                  placeholder='Enter your text here...' />
              </Grid.Column>
            </Grid>
          </Form>
        </Segment>
      </div>
    </section>
  );
};
