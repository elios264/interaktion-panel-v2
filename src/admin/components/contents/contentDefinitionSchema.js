import _ from 'lodash';
import Joi from 'joi';
import { ContentDefinition } from 'objects';
import { getJoiLanguagesValidationSchema } from 'controls';

export const contentDefinitionSchema = {
  enabled: Joi.boolean().required().label('Enabled'),
  title: getJoiLanguagesValidationSchema('Title', (r) => r.max(200)),
  description: getJoiLanguagesValidationSchema('Description', (r) => r.max(2000)),
  mobileView: Joi.string().valid(..._.values(ContentDefinition.mobileView)).required().label('Mobile view'),
  sortContentsBy: Joi.string().valid(..._.values(ContentDefinition.sortContentsBy)).required().label('Contents order'),
  image: Joi.object().required().label('Image'),
};
