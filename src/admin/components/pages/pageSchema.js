import _ from 'lodash';
import Joi from 'joi';
import { Page } from 'objects';
import { getJoiLanguagesValidationSchema } from 'controls';

export const pageSchema = {
  visibility: Joi.string().valid(..._.values(Page.visibility)).label('Visibility'),
  title: getJoiLanguagesValidationSchema('Title', (r) => r.max(200)),
  description: getJoiLanguagesValidationSchema('Description', (r) => r.max(2000)),
  document: Joi.object({ [window.__ENVIRONMENT__.APP_LOCALE]: Joi.array().required().label(`Document ${window.__ENVIRONMENT__.APP_LOCALE}`) }).pattern(/.*/, Joi.array().label('Document')).required().label('Document'),
};

const pageImportSchema = {
  ...pageSchema,
  documentResources: Joi.array().items(Joi.object()).max(50),
};

export const pageImportDefinition = {
  title: 'Pages',
  property: 'pages',
  matchBy: `title[${window.__ENVIRONMENT__.APP_LOCALE}]`,
  schema: pageImportSchema,
  displayName: (entity) => _.get(entity, `title[${window.__ENVIRONMENT__.APP_LOCALE}]`),
  detailsUrl: (storeEntity) => `/pages/${storeEntity.id}`,
};
