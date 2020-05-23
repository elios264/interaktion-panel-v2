import _ from 'lodash';
import React from 'react';
import { useSelector } from 'react-redux';
import Joi from '@hapi/joi';
import { Link } from 'react-router-dom';
import { Grid, Menu, Button, Segment, Form, Divider, Image, Modal } from 'semantic-ui-react';
import { Helmet } from 'react-helmet';

import { Popup, getJoiLanguagesValidationSchema, LoadingDots, MultiLanguageInput, MultiLanguageTextArea, Selector } from 'controls';
import { useFieldset, useAsyncSubmit, useDispatchCallback } from 'controls/hooks';
import { ContentDefinition } from 'objects';
import { ResourceImageSelector } from 'admin/components/common';
import { saveContentDefinition } from 'admin/actions/contents';


export const enabledOptions = [{ key: 1, text: ContentDefinition.getEnabledName(true), value: true }, { key: 2, text: ContentDefinition.getEnabledName(true), value: false }];
export const mobileViewOptions = [
  {
    key: 0,
    value: ContentDefinition.mobileView.chess,
    text: <><Image src={require('img/contents/chessView.png')} /> <span>{ContentDefinition.getMobileViewName(ContentDefinition.mobileView.chess)}</span></>,
  },
  {
    key: 1,
    value: ContentDefinition.mobileView.full,
    text: <><Image src={require('img/contents/landView.png')} /> <span>{ContentDefinition.getMobileViewName(ContentDefinition.mobileView.full)}</span></>,
  },
  {
    key: 2,
    value: ContentDefinition.mobileView.list,
    text: <><Image src={require('img/contents/listingView.png')} /> <span>{ContentDefinition.getMobileViewName(ContentDefinition.mobileView.list)}</span></>,
  },
];

const contentDefinitionTemplate = new ContentDefinition({ mobileView: ContentDefinition.mobileView.chess, enabled: true });
export const contentDefinitionSchema = {
  enabled: Joi.boolean().required().label('Enabled'),
  title: getJoiLanguagesValidationSchema('Title', 200),
  description: getJoiLanguagesValidationSchema('Description', 2000),
  mobileView: Joi.string().valid(..._.values(ContentDefinition.mobileView)).required().label('Mobile view'),
  image: Joi.object().required().label('Image'),
};

export const ContentDefinitionDetails = ({ history, match }) => {
  const isEditing = match.params.action === 'edit';
  const isCreating = match.params.action === 'create';

  const isWorking = useSelector((state) => state.siteInfo.isWorking);
  const contentDefinition = useSelector((state) => state.objects.contentDefinitions[match.params.definitionId]);

  const switchToListMode = (newContentDefinition) => history.replace(`/contents/${(newContentDefinition instanceof ContentDefinition) ? newContentDefinition.id : contentDefinition.id}`);
  const saveContentDefinitionAndGoToListing = useAsyncSubmit(useDispatchCallback(saveContentDefinition), switchToListMode);


  const { fields, submit, loading, reset } = useFieldset({
    schema: contentDefinitionSchema,
    onSubmit: saveContentDefinitionAndGoToListing,
    source: contentDefinition || contentDefinitionTemplate,
  });
  const { enabled, title, description, mobileView, image } = fields;


  if (!isCreating && !contentDefinition) {
    return (
      <Modal dimmer='blurring' open size='tiny'>
        <Modal.Header content={isWorking ? 'Loading section details' : 'Section not found'} />
        <Modal.Content content={isWorking ? <LoadingDots prefix='We are getting the info you requested' /> : 'We could not locate the specified section.'} />
        <Modal.Actions>
          <Button as={Link} to='/' primary icon='external' labelPosition='right' content='Go back to main page...' />
        </Modal.Actions>
      </Modal>
    );
  }

  return (
    <section className='content-definition-details'>
      <Helmet title={`${_.get(contentDefinition, ['title', window.__ENVIRONMENT__.APP_LOCALE], 'Create')} | Sections`} />
      <Menu attached stackable className='sticky-ns z-1'>
        {isEditing && (
          <Menu.Item position='right'>
            <Button as={Link} to={`/contents/${contentDefinition.id}`} icon='external' fluid content='Back to listing' />
          </Menu.Item>
        )}
      </Menu>
      <div className='pa2'>
        <Segment raised>
          <Form onSubmit={submit}>
            <Grid centered divided stackable>
              <Grid.Column computer={16} largeScreen={8} widescreen={8}>
                <Grid.Row>
                  <Form.Group widths='equal'>
                    <Form.Field error={title.errored} required>
                      <label>Title</label>
                      <Popup message={title.message} enabled={title.errored}>
                        <MultiLanguageInput value={title.value} onChange={title.onChange} autoComplete='off' />
                      </Popup>
                    </Form.Field>
                  </Form.Group>
                  <Form.Group widths='equal'>
                    <Form.Field error={enabled.errored} required>
                      <label>Status</label>
                      <Popup message={enabled.message} enabled={enabled.errored}>
                        <Selector options={enabledOptions} value={enabled.value} onChange={enabled.onChange} />
                      </Popup>
                    </Form.Field>
                    <Form.Field error={mobileView.errored} required>
                      <label>Mobile view</label>
                      <Popup message={mobileView.message} enabled={mobileView.errored}>
                        <Selector
                          options={mobileViewOptions}
                          value={mobileView.value}
                          onChange={mobileView.onChange} />
                      </Popup>
                    </Form.Field>
                  </Form.Group>
                  <Grid stackable columns={2}>
                    <Grid.Row stretched>
                      <Grid.Column>
                        <Form.Field error={image.errored} required>
                          <label>Image<span className='i silver ml2'>Recommended aspect ratio: 4:1</span></label>
                          <Popup message={image.message} enabled={image.errored}>
                            <ResourceImageSelector
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
                              placeholder='Short description.' />
                          </Popup>
                        </Form.Field>
                      </Grid.Column>
                    </Grid.Row>
                  </Grid>
                </Grid.Row>
                <Divider hidden />
                <Divider />
                <Grid.Row className='tr'>
                  <Button
                    type='button'
                    className='w-100 w-auto-ns'
                    secondary
                    disabled={loading}
                    loading={loading}
                    onClick={isCreating ? reset : switchToListMode}
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
                    content={isCreating ? 'Create section!' : 'Save'} />
                </Grid.Row>
              </Grid.Column>
              <Grid.Column computer={16} largeScreen={8} widescreen={8} className='flex-important flex-column' />
            </Grid>
          </Form>
        </Segment>
      </div>
    </section>
  );

};
