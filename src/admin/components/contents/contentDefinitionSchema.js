import _ from 'lodash';
import Joi from '@hapi/joi';
import { ContentDefinition } from 'objects';
import { getJoiLanguagesValidationSchema } from 'controls';

export const contentDefinitionSchema = {
  enabled: Joi.boolean().required().label('Enabled'),
  title: getJoiLanguagesValidationSchema('Title', 200),
  description: getJoiLanguagesValidationSchema('Description', 2000),
  mobileView: Joi.string().valid(..._.values(ContentDefinition.mobileView)).required().label('Mobile view'),
  image: Joi.object().required().label('Image'),
};
