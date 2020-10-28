import _ from 'lodash';
import {
  handleError, showSuccess, showConfirm, showModal,
} from 'utils/actions';

import { utils } from 'controls';
import {
  BaseObject, File, Resource, Page,
} from 'objects';
import { ImportObjectsAssistantModal } from 'admin/components/common';
import { pageImportDefinition } from 'admin/components/pages/pageSchema';

const { jsonKeys, actions } = ImportObjectsAssistantModal;

export const sendPageNotification = (page) => handleError(async (dispatch, getState, { api }) => {
  await api.runCloudCode('send-page-notification', { pageId: page.id });
  api.logEvent('sent-page-notification', page);
  return true;
}, 'The notification for the page could not be sent');

export const savePage = (page, silentAndRethrow = false) => handleError(async (dispatch, getState, { api }) => {
  let result;

  if (!silentAndRethrow && page.visibility !== Page.visibility.none) {
    ({ result } = await dispatch(showConfirm({
      header: 'Do you wish to send a push notification?',
      options: ['Save page only', 'Save page and send a push notification'],
      onAccept: (selectedOption) => api
        .saveObject(page)
        .then(() => (selectedOption === 1 ? dispatch(sendPageNotification(page)).then(() => page) : page)),
    })));

  } else {
    result = await api.saveObject(page);
  }

  if (result) {
    if (!silentAndRethrow) {
      dispatch(showSuccess({ content: 'The page has been successfully saved!' }));
    }

    api.logEvent('save-page', result);
  }

  return result;
}, silentAndRethrow ? null : 'The page could not be saved', { silent: silentAndRethrow, rethrow: silentAndRethrow });

export const deletePage = (page) => handleError(async (dispatch, getState, { api }) => {
  const { result } = await dispatch(showConfirm({
    content: `Confirm PERMANENT deletion of page "${page.title[window.__ENVIRONMENT__.APP_LOCALE]}"`,
    onAccept: () => api.deleteObject(page),
  }));

  if (result) {
    dispatch(showSuccess({ content: `The page "${page.title[window.__ENVIRONMENT__.APP_LOCALE]}" has been successfully deleted!` }));
    api.logEvent('delete-page', page);
  }
  return result;
}, 'The page could not be deleted');

export const exportPages = ({ onlyData = false } = {}) => handleError((dispatch, getState) => {

  const selectedPages = _.map(getState().objects.pages, (page) => {
    const {
      objectId: id, documentResources, ...rest
    } = page.toFullJSON();
    const resources = _(documentResources).map(({ objectId }) => getState().objects.resources[objectId]).compact().value();
    return {
      id, documentResources: _.invokeMap(resources, 'toFullJSON'), ...rest,
    };
  });

  const data = {
    version: window.__ENVIRONMENT__.BUILD,
    environment: window.__ENVIRONMENT__.BUILD_ENVIRONMENT,
    references: { pages: false },
    pages: selectedPages,
  };

  if (onlyData) {
    return data;
  }

  const blob = utils.objectToJSONBlob(data);
  utils.downloadBlob(blob, `Pages at ${utils.formatDate()}.json`);

}, 'The pages could not be exported');

export const importPages = ({
  json, dryRun, logProgress = _.noop, rethrow = false,
} = {}) => handleError((dispatch, getState, { api }) => {

  // eslint-disable-next-line no-shadow
  const importData = ({ json, dryRun, logProgress }) => dispatch(handleError(async () => {
    // no data to validate
    if (dryRun) {
      return;
    }
    const savePageAs = async (mode, pageJSON) => {

      const pageJSONToSave = mode === 'restore'
        ? ({ ..._.omit(pageJSON, 'id'), objectId: pageJSON.id })
        : _.pickBy(({
          ..._.omit(pageJSON, 'id', jsonKeys.operation),
          objectId: mode === 'update' ? _.get(pageJSON, jsonKeys.operationValue) : undefined,
        }), _.negate(_.isUndefined));

      const pageName = pageJSONToSave.title[window.__ENVIRONMENT__.APP_LOCALE];
      const thenAction = utils.getValue(mode, { restore: 'restored', update: 'updated', create: 'created' });
      const catchAction = utils.getValue(mode, { restore: 'restoring', update: 'updating', create: 'creating' });

      let page = BaseObject.fromJSON(pageJSONToSave);

      try {
        // documentResources special handling
        if (mode !== 'restore') {
          const documentResourcesToSave = _(page.documentResources)
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
          page.documentResources = await Promise.all(documentResourcesToSave);
        }

        if (mode === 'create') {
          page = page.clone();
        } else {
        // eslint-disable-next-line no-return-assign, no-self-assign
          _.each(['visibility', 'document', 'title', 'description', 'documentResources', 'order'], (prop) => page[prop] = page[prop]);
        }

        return dispatch(savePage(page, true)).then(() => logProgress(`Page "${pageName}" ${thenAction} successfully`));

      } catch (err) {
        logProgress(`ERROR: while ${catchAction} page "${pageName}": ${err.message}.`);
      }
    };

    if (json[jsonKeys.isRestore]) {
      const differentPages = _(json.pages)
        .map((page) => ({ page, storePage: _.invoke(getState().objects.pages[page.id], 'toFullJSON') }))
        .filter(({ page, storePage }) => storePage && !utils.equalBy(page, storePage, 'visibility', 'title', 'description', 'document', 'order'))
        .map('page')
        .value();

      logProgress(`Found ${_.size(differentPages)} pages with differences (checked properties: visibility, title, description, document, order)\n`);

      await Promise.all(_.map(differentPages, _.partial(savePageAs, 'restore')));
      api.logEvent('restore-pages');

    } else {
      const { [actions.create]: toCreate, [actions.update]: toUpdate } = _.groupBy(json.pages, jsonKeys.operationAction);

      logProgress(`Creating ${_.size(toCreate)} page and updating ${_.size(toUpdate)} pages`);

      await Promise.all([
        ..._.map(toCreate, _.partial(savePageAs, 'create')),
        ..._.map(toUpdate, _.partial(savePageAs, 'update')),
      ]);

      api.logEvent('import-pages');
    }

    return true;
  }, null, { rethrow: true, silent: true }));

  return json
    ? importData({ json, dryRun, logProgress })
    : dispatch(showModal({
      custom: ImportObjectsAssistantModal,
      onImport: importData,
      onExport: () => dispatch(exportPages()),
      definitions: [pageImportDefinition],
    }));

}, 'The pages could not be imported', { rethrow, silent: rethrow });
