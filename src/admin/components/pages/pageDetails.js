import _ from 'lodash';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import {
  Grid, Menu, Modal, Button, Segment, Form, Divider, Message, Label,
} from 'semantic-ui-react';
import { Helmet } from 'react-helmet';

import { Page } from 'objects';
import { useFieldset, useAsyncSubmit, useDispatchCallback } from 'controls/hooks';
import {
  Popup, LoadingDots, Selector, AwaitableButton, MultiLanguageInput, MultiLanguageTextArea, RichTextEditor, utils,
} from 'controls';

import { saveResource } from 'admin/actions/resources';
import { savePage, deletePage } from 'admin/actions/pages';
import { pageSchema } from './pageSchema';

const visibilityOptions = _.map(Page.visibility, (value, key) => ({ key, value, text: Page.getVisibilityName(value) }));

const pageTemplate = new Page({
  visibility: Page.visibility.public,
});

export const PageDetails = ({ history, match }) => {

  const isEditing = match.params.action === 'edit';
  const isCreating = match.params.action === 'create';

  const isWorking = useSelector((state) => state.siteInfo.isWorking);
  const page = useSelector((state) => state.objects.pages[match.params.pageId]);
  const resources = useSelector((state) => state.objects.resources);

  const saveRes = useDispatchCallback(saveResource);
  const switchToDetailsMode = (newPage) => history.replace(`/pages/${(newPage instanceof Page) ? newPage.id : page.id}`);
  const savePageAndGoToDetails = useAsyncSubmit(useDispatchCallback(savePage), switchToDetailsMode);
  const deletePageAndGoToCreate = useAsyncSubmit(useDispatchCallback(deletePage, page), () => history.replace('/pages/create'));

  const {
    fields, submit, loading, reset,
  } = useFieldset({
    schema: pageSchema,
    enabled: isEditing || isCreating,
    onSubmit: savePageAndGoToDetails,
    source: page || pageTemplate,
  });
  const {
    document, visibility, title, description,
  } = fields;

  if ((!isCreating && !page)) {
    return (
      <Modal dimmer='blurring' open size='tiny'>
        <Modal.Header content={isWorking ? 'Loading page details' : 'Page not found'} />
        <Modal.Content content={isWorking ? <LoadingDots prefix='We are getting the info you requested' /> : 'We could not locate the specified page.'} />
        <Modal.Actions>
          <Button as={Link} to='/' primary icon='external' labelPosition='right' content='Go back to main page...' />
        </Modal.Actions>
      </Modal>
    );
  }

  return (
    <section className='page-details'>
      <Helmet title={`${_.get(page, `title[${window.__ENVIRONMENT__.APP_LOCALE}]`, 'New')} | Page`} />
      <Menu attached stackable className='sticky-ns z-1'>
        {!isCreating && (
          <Menu.Item>
            <Button disabled={isEditing} as={Link} to={`/pages/${page.id}/edit`} replace fluid color='yellow' icon='edit' content='Edit' />
          </Menu.Item>
        )}
        {!isCreating && (
          <Menu.Item>
            <AwaitableButton disabled={isEditing} fluid icon='trash' negative content='Delete' onClick={deletePageAndGoToCreate} />
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
                        <MultiLanguageInput value={title.value} onChange={title.onChange} autoComplete='off' disabled={!isEditing && !isCreating} />
                      </Popup>
                    </Form.Field>
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
                  </Form.Group>
                </Grid.Row>
                <Grid.Row>
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
                </Grid.Row>
                <Divider hidden />
                <Divider />
                {(!isCreating && !isEditing) && (
                  <Grid.Row className='mt3 flex justify-around flex-wrap flex-column flex-row-ns'>
                    <div className='ma1'><Label color='green' icon='calendar' content={`Created ${utils.formatDate(page.createdAt)}`} /></div>
                    <div className='ma1'><Label color='orange' icon='calendar' content={`Updated ${utils.formatDate(page.updatedAt)}`} /></div>
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
                      content={isCreating ? 'Create page!' : 'Save'}
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
                  saveResource={saveRes}
                  resources={resources}
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
