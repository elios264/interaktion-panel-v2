import _ from 'lodash';
import { handleError, showSuccess, showConfirm, showModal } from 'utils/actions';

import { utils } from 'controls';
import { BaseObject, File, Resource } from 'objects';
import { ImportObjectsAssistantModal } from 'admin/components/common';
import { contentImportDefinition } from 'admin/components/contents/contentSchema';

const { jsonKeys, actions } = ImportObjectsAssistantModal;

export const sendContentNotification = (content) => handleError(async (dispatch, getState, { api }) => {
  await api.runCloudCode('send-content-notification', { contentId: content.id });
  api.logEvent('sent-content-notification', content);
  return true;
}, 'The notification for the content could not be sent');

export const saveContent = (content, silentAndRethrow = false) => handleError(async (dispatch, getState, { api }) => {
  let result;

  if (!silentAndRethrow) {
    ({ result } = await dispatch(showConfirm({
      header: 'Do you wish to send a push notification?',
      options: [
        'Save content only',
        'Save content and send a push notification',
      ],
      onAccept: async (selectedOption) => {
        const result = await api.saveObject(content);
        if (selectedOption === 1) {
          await dispatch(sendContentNotification(content));
        }
        return result;
      },
    })));

  } else {
    result = await api.saveObject(content);
  }

  if (result) {
    if (!silentAndRethrow) {
      dispatch(showSuccess({ content: 'The content has been successfully saved!' }));
    }

    api.logEvent('save-content', result);
  }

  return result;
}, silentAndRethrow ? null : 'The content could not be saved', { silent: silentAndRethrow, rethrow: silentAndRethrow });

export const deleteContent = (content) => handleError(async (dispatch, getState, { api }) => {
  const { result } = await dispatch(showConfirm({
    content: `Confirm PERMANENT deletion of content "${content.title[window.__ENVIRONMENT__.APP_LOCALE]}"`,
    onAccept: () => api.deleteObject(content),
  }));

  if (result) {
    dispatch(showSuccess({ content: `The content "${content.title[window.__ENVIRONMENT__.APP_LOCALE]}" has been successfully deleted!` }));
    api.logEvent('delete-content', content);
  }
  return result;
}, 'The content could not be deleted');

export const deleteSelectedContents = (contentsIds) => handleError(async (dispatch, getState, { api }) => {
  const contents = _.values(_.pick(getState().objects.contents, contentsIds));

  if (!contents.length) {
    return true;
  }

  const { result } = await dispatch(showConfirm({
    content: `Confirm PERMANENT deletion of ${contents.length} content(s)`,
    onAccept: () => api.deleteObjects(contents),
  }));

  if (result) {
    dispatch(showSuccess({ content: `${contents.length} content(s) have been successfully deleted!` }));
    api.logEvent('delete-contents', contents);
  }
  return result;
}, 'The contents(s) could not be deleted');

export const cloneContent = (content) => handleError(async (dispatch, getState, { api }) => {
  const { result } = await dispatch(showConfirm({
    content: `Confirm cloning of content "${content.title[window.__ENVIRONMENT__.APP_LOCALE]}"`,
    onAccept: () => api.saveObject(content.clone(), { title: { ...content.title, [window.__ENVIRONMENT__.APP_LOCALE]: `${_.truncate(content.title[window.__ENVIRONMENT__.APP_LOCALE], { length: 190 })} copy` } }),
  }));

  if (result) {
    dispatch(showSuccess({ content: `The content "${content.title[window.__ENVIRONMENT__.APP_LOCALE]}" has been successfully cloned!` }));
    api.logEvent('clone-content', result);
  }
  return result;
}, 'An error ocurred when cloning the content');


export const exportContents = ({ contentsIds, definition, onlyData = false }) => handleError((dispatch, getState) => {

  let selectedContents = !_.size(contentsIds)
    ? _.filter(getState().objects.contents, (content) => content.definition.id === definition.id)
    : _(contentsIds).map((id) => getState().objects.contents[id]).compact().value();

  selectedContents = _.map(selectedContents, (content) => {
    const { objectId: id, image, documentResources, ...rest } = content.toFullJSON();
    const resource = getState().objects.resources[image.objectId];
    const resources = _(documentResources).map(({ objectId }) => getState().objects.resources[objectId]).compact().value();
    return { id, image: resource && resource.toFullJSON(), documentResources: _.invokeMap(resources, 'toFullJSON'), ...rest };
  });

  const data = {
    version: window.__ENVIRONMENT__.BUILD,
    environment: window.__ENVIRONMENT__.BUILD_ENVIRONMENT,
    references: {},
    contents: selectedContents,
  };

  if (onlyData) {
    return data;
  }

  const blob = utils.objectToJSONBlob(data);
  utils.downloadBlob(blob, `${definition.title[window.__ENVIRONMENT__.APP_LOCALE]} at ${utils.formatDate()}.json`);

}, 'The contents could not be exported');


export const importContents = ({ definition, json, dryRun, logProgress = _.noop, rethrow = false }) => handleError((dispatch, getState, { api }) => {

  const importData = ({ json, dryRun, logProgress }) => dispatch(handleError(async () => {
    // no data to validate
    if (dryRun) {
      return;
    }
    const saveContentAs = async (mode, contentJSON) => {

      const contentJSONToSave = mode === 'restore'
        ? ({ ..._.omit(contentJSON, 'id'), objectId: contentJSON.id })
        : _.pickBy(({
          ..._.omit(contentJSON, 'id', jsonKeys.operation),
          definition: definition.toFullJSON(),
          objectId: mode === 'update' ? _.get(contentJSON, jsonKeys.operationValue) : undefined,
        }), _.negate(_.isUndefined));

      const contentName = contentJSONToSave.title[window.__ENVIRONMENT__.APP_LOCALE];
      const thenAction = utils.getValue(mode, { restore: 'restored', update: 'updated', create: 'created' });
      const catchAction = utils.getValue(mode, { restore: 'restoring', update: 'updating', create: 'creating' });

      let content = BaseObject.fromJSON(contentJSONToSave);

      try {
        // image and documentResources special handling
        if (mode !== 'restore') {
          let imageToSave = _.find(getState().objects.resources, ['metadata.hash', content.image.metadata.hash]);
          if (!imageToSave) {
            const base64 = await utils.blobFromUrl(content.image.fileUrl)
              .catch(() => utils.blobFromUrl(require('img/empty.png')))
              .then(utils.toReadable);
            imageToSave = new Resource({ src: new File(content.image.fileName, { base64 }) });
          }
          content.image = imageToSave;

          const documentResourcesToSave = _(content.documentResources)
            .map((resource) => ({ existingResource: _.find(getState().objects.resources, ['metadata.hash', resource.metadata.hash]), resource }))
            .map(async ({ resource, existingResource }) => {
              if (!existingResource) {
                const base64 = await utils.blobFromUrl(resource.fileUrl)
                  .catch(() => utils.blobFromUrl(require('img/empty.png')))
                  .then(utils.toReadable);
                existingResource = new Resource({ src: new File(resource.fileName, { base64 }) });
              }
              return existingResource;
            })
            .value();
          content.documentResources = await Promise.all(documentResourcesToSave);
        }

        if (mode === 'create') {
          content = content.clone();
        } else {
        // eslint-disable-next-line no-return-assign, no-self-assign
          _.each(['definition', 'image', 'visibility', 'document', 'title', 'description', 'documentResources', 'entityType', 'entityInfo'], (prop) => content[prop] = content[prop]);
        }

        return dispatch(saveContent(content, true)).then(() => logProgress(`Content "${contentName}" ${thenAction} successfully`));

      } catch (err) {
        logProgress(`ERROR: while ${catchAction} content "${contentName}": ${err.message}.`);
      }
    };

    if (json[jsonKeys.isRestore]) {
      const differentContents = _(json.contents)
        .map((content) => ({ content, storeContent: _.invoke(getState().objects.contents[content.id], 'toFullJSON') }))
        .filter(({ content, storeContent }) => storeContent && !utils.equalBy(content, storeContent, 'entityInfo', 'entityType', 'definition.objectId', 'image.objectId', 'visibility', 'title', 'description', 'document'))
        .map('content')
        .value();

      logProgress(`Found ${_.size(differentContents)} contents with differences (checked properties: entityInfo, entityType, definition, image, visibility, title, description, document)\n`);

      await Promise.all(_.map(differentContents, _.partial(saveContentAs, 'restore')));
      api.logEvent('restore-collection', { collection: definition.title[window.__ENVIRONMENT__.APP_LOCALE] });

    } else {
      const { [actions.create]: toCreate, [actions.update]: toUpdate } = _.groupBy(json.contents, jsonKeys.operationAction);

      logProgress(`Creating ${_.size(toCreate)} contents and updating ${_.size(toUpdate)} contents`);

      await Promise.all([
        ..._.map(toCreate, _.partial(saveContentAs, 'create')),
        ..._.map(toUpdate, _.partial(saveContentAs, 'update')),
      ]);

      api.logEvent('import-collection', { collection: definition.title[window.__ENVIRONMENT__.APP_LOCALE] });
    }

    return true;
  }, null, { rethrow: true, silent: true }));

  return json ?
    importData({ definition, json, dryRun, logProgress })
    : dispatch(showModal({
      custom: ImportObjectsAssistantModal,
      onImport: importData,
      onExport: () => dispatch(exportContents({ definition })),
      definitions: [{
        ...contentImportDefinition,
        propertyFilterer: (content) => content.definition.id === definition.id,
      }],
    }));

}, 'The contents could not be imported', { rethrow, silent: rethrow });
