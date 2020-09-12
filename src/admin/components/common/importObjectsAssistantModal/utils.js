import _ from 'lodash';

// the definition is required only if all of their parents are not references
export const getRequiredDefinitions = (definitions, json) => _(definitions)
  .filter(({ property }) => {
    const parents = _(definitions)
      .filter(((definition) => definition.property !== property))
      .filter((definition) => _.find(definition.children, ['collection', property]))
      .value();
    return _.every(parents, (parent) => json[parent.property] && !json.references[parent.property]);
  })
  .map(({ children, ...definition }, ignored, requiredDefinitions) => ({
    ...definition,
    children: _.filter(children, ({ collection }) => _.find(requiredDefinitions, ['property', collection])),
  }))
  .value();
