import _ from 'lodash';
import PropTypes from 'prop-types';
import React, { useMemo, useCallback } from 'react';
import { Form, Header, Button, Modal, Accordion } from 'semantic-ui-react';
import Joi from '@hapi/joi';
import { useStore } from 'react-redux';

import { utils } from 'controls';
import { useFieldset } from 'controls/hooks';
import { handleError } from 'utils/actions';
import { EntityDetails } from './entityDetails';
import { jsonKeys, actions } from '../../types';


const actionSchema = Joi.string().valid(..._.values(actions)).label('action');
const actionSchemaNoReference = Joi.string().valid(actions.ignore, actions.create, actions.update).label('action');
const actionSchemaOnlyReferenceAndIgnore = Joi.string().valid(actions.reference, actions.ignore).label('action');

const valueSchema = Joi.alternatives().try(Joi.number(), Joi.string()).label('value');
const updateOrReferenceSchema = Joi.string().valid(actions.update, actions.reference);
const requiredSchema = Joi.required();
const stripSchema = Joi.any().strip();

export const ArrangeEntitiesStep = ({ definitions, onBack, onNext, header, json, onImport }) => {
  const store = useStore();

  const { source, schema } = useMemo(() => _(definitions)
    .flatMap((definition) => _.map(json[definition.property], (entity) => ({ definition, entity })))
    .transform((acc, { definition, entity }) => {
      const { id, [jsonKeys.operation]: operation } = entity;
      const { allowReferences, property, matchBy, propertyFilterer = _.stubTrue } = definition;
      const isReference = json.references[property];

      const actionKey = `${property}-${id}-action`;
      const valueKey = `${property}-${id}-value`;

      if (operation) {
        acc.source[actionKey] = operation.action;
        acc.source[valueKey] = operation.value;
      } else {
        const storeMatch = _(store.getState().objects[property])
          .filter(propertyFilterer)
          .find(_.isString(matchBy) ? [matchBy, _.get(entity, matchBy)] : (storeEntity) => matchBy(entity, storeEntity, json, store.getState().objects));
        acc.source[actionKey] = isReference ? actions.reference : (storeMatch ? actions.update : actions.create);
        acc.source[valueKey] = storeMatch ? storeMatch.id : undefined;
      }

      acc.schema[actionKey] = allowReferences ? (isReference ? actionSchemaOnlyReferenceAndIgnore : actionSchema) : actionSchemaNoReference;
      acc.schema[valueKey] = valueSchema.when(actionKey, { is: updateOrReferenceSchema, then: requiredSchema, otherwise: stripSchema });

    }, { source: {}, schema: {} })
    .value(),
  [store, json, definitions]);

  const onSubmit = useCallback((source) => store.dispatch(handleError(async () => {

    // here I attach the operations to each one of the entities
    _(definitions)
      .flatMap((definition) => _.map(json[definition.property], (entity) => ({ definition, entity })))
      .each(({ definition, entity }) => {
        const { id } = entity;
        const { property } = definition;
        json[property][id][jsonKeys.operation] = _.pickBy({
          action: source[`${property}-${id}-action`],
          value: source[`${property}-${id}-value`],
        });
      });

    // at least one update or create validation
    if (_.every(source, (value) => value !== actions.create && value !== actions.update)) {
      throw new Error('No entities to update or create were found');
    }

    // no duplicate keys to update validation
    _.each(definitions, ({ property, title }) => {
      const values = _(json[property]).map(jsonKeys.operationValue).filter(_.isNumber).value();
      const uniqueValues = new Set(values);
      if (values.length !== uniqueValues.size) {
        throw new Error(`In collection "${title}": more than one arrangement instructs to update or reference the same entity`);
      }
    });

    // single children are not ignored validation
    _(definitions).filter('children').flatMap(({ property, children, title }) => _.map(children, (child) => ({ property, child, title }))).each(({ property, child, title }) => {

      const childrenIgnored = _(json[property])
        .filter((entity) => _.some([actions.create, actions.update], (action) => action === _.get(entity, jsonKeys.operationAction)))
        .flatMap((entity) => {
          const childValue = _.get(entity, child.accessor);
          return _.isArray(childValue) ? [] : childValue; // only single children are required, as the array children just represent an empty array.
        })
        .uniq()
        .some((childId) => _.get(json[child.collection][childId], jsonKeys.operationAction) === actions.ignore);

      if (childrenIgnored) {
        throw new Error(`In collection "${title}": some required referenced ${child.collection} are being ignored`);
      }

    });

    // custom collections data contradictions validation
    await onImport({ dryRun: true, json });

    return onNext(json);
  }, 'Arrangement error')), [store, definitions, onNext, json, onImport]);

  const { fields, loading, submit } = useFieldset({ source, schema, onSubmit });

  return (
    <>
      <Modal.Content as={Form}>
        {header}
        <Header size='small'>Make sure the entities in the file have the correct action assigned to them in relation to the entities in this environment</Header>
        <Accordion
          fluid
          styled
          exclusive={false}
          defaultActiveIndex={[0]}
          panels={_.map(definitions, (definition) => ({
            key: definition.property,
            title: { content: <EntityDetails.Header definition={definition} initialFields={source} fields={fields} json={json} /> },
            content: { content: <EntityDetails definition={definition} initialFields={source} fields={fields} json={json} /> },
          }))} />
      </Modal.Content>
      <Modal.Actions className='flex items-center'>
        <span className='mr-auto b'>Found {utils.joinAndSeparator(_.map(definitions, ({ title, property }) => `${_.size(json[property])} ${_.toLower(title)}`))} in the file</span>
        <Button disabled={loading} loading={loading} onClick={onBack} secondary icon='left chevron' labelPosition='left' content='Back' />
        <Button disabled={loading} loading={loading} onClick={submit} primary icon='right chevron' labelPosition='right' content='Next' />
      </Modal.Actions>
    </>
  );
};
ArrangeEntitiesStep.propTypes = {
  definitions: PropTypes.array.isRequired,
  onBack: PropTypes.func.isRequired,
  onNext: PropTypes.func.isRequired,
  onImport: PropTypes.func.isRequired,
  json: PropTypes.object.isRequired,
  header: PropTypes.node.isRequired,
};
