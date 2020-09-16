import _ from 'lodash';
import Joi from '@hapi/joi';
import { Content } from 'objects';
import { getJoiLanguagesValidationSchema } from 'controls';

export const entityTypeContentSchema = {};
export const entityTypeEventSchema = {
  location: Joi.string().trim().required().max(200).label('Location'),
  start: Joi.object().instance(Date).required().label('Start date'),
};

export const contentSchema = {
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
  document: Joi.object({ [window.__ENVIRONMENT__.APP_LOCALE]: Joi.array().required().label('Document') }).pattern(/.*/, Joi.array().label('Document')).required().label('Document'),
};

const contentImportSchema = {
  ...contentSchema,
  documentResources: Joi.array().items(Joi.object()).max(50),
};

export const contentImportDefinition = {
  title: 'Contents',
  property: 'contents',
  matchBy: `title[${window.__ENVIRONMENT__.APP_LOCALE}]`,
  schema: contentImportSchema,
  displayName: (entity) => _.get(entity, `title[${window.__ENVIRONMENT__.APP_LOCALE}]`),
  detailsUrl: (storeEntity) => `/contents/${storeEntity.definition.id}/details/${storeEntity.id}`,
};
