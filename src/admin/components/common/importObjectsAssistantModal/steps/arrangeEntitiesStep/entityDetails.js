import _ from 'lodash';
import PropTypes from 'prop-types';
import {
  memo, useMemo, useCallback, useRef,
} from 'react';
import { List, Checkbox } from 'semantic-ui-react';
import { useSelector, batch, useStore } from 'react-redux';
import cx from 'classnames';

import { EntityMatcher } from './entityMatcher';
import { actions } from '../../types';

export const EntityDetails = ({
  definition, json, fields, initialFields,
}) => {
  const { property, propertyFilterer = _.stubTrue } = definition;

  const fieldsRef = useRef();
  fieldsRef.current = fields;

  const store = useStore();
  const storeEntities = useSelector((state) => state.objects[property]);
  const filteredStoreEntities = useMemo(() => _.filter(storeEntities, propertyFilterer), [storeEntities, propertyFilterer]);

  const valueOptions = useMemo(() => _.map(filteredStoreEntities, (storeEntity) => ({
    key: _.toString(storeEntity.id),
    value: storeEntity.id,
    text: definition.displayName(storeEntity, store.getState().objects),
  })), [filteredStoreEntities, definition, store]);

  const actionOptions = useMemo(() => [{
    key: actions.create, value: actions.create, text: 'will be created', disabled: json.references[property],
  }, {
    key: actions.update, value: actions.update, text: 'will update', disabled: json.references[property],
  }, { key: actions.ignore, value: actions.ignore, text: 'will be ignored' }, {
    key: actions.reference, value: actions.reference, text: 'is a reference to', disabled: !definition.allowReferences,
  }],
  [definition.allowReferences, json.references, property]);

  const onFieldChange = useCallback(({
    definition: def, field, entity, value,
  }) => batch(() => {
    const { property: prop, children } = def;

    // here I set the value of the duplicated field to undefined
    if (field === 'value') {
      _(json[prop])
        .filter(({ id }) => id !== entity.id)
        .map(({ id }) => fieldsRef.current[`${prop}-${id}-value`])
        .filter((fld) => fld.value === value)
        .invokeMap('onChange')
        .value();
    }

    // here I add or ignore the children depending on the parent.
    if (_.size(children) && field === 'action') {

      _(children).flatMap(({ collection, accessor }) => {

        let childrenIdsToUpdate = _.flatMap([entity], accessor);

        if (value === actions.ignore) {
          const allCreateOrUpdateEntitiesChildrenIds = _(json[prop])
            .filter(({ id }) => id !== entity.id)
            .filter(({ id }) => _.some([actions.update, actions.create], (action) => action === fieldsRef.current[`${prop}-${id}-action`].value))
            .flatMap(accessor)
            .uniq()
            .value();
          childrenIdsToUpdate = _.difference(childrenIdsToUpdate, allCreateOrUpdateEntitiesChildrenIds);
        }

        return _.map(childrenIdsToUpdate, (childId) => ({ childId, collection }));

      }).each(({ childId, collection }) => {

        const childActionKey = `${collection}-${childId}-action`;
        const newActionValue = value === actions.ignore ? actions.ignore : initialFields[childActionKey];
        if (fieldsRef.current[childActionKey].value !== newActionValue) {
          fieldsRef.current[childActionKey].onChange(newActionValue);
        }

        if (value !== actions.ignore) {
          const childValueKey = `${collection}-${childId}-value`;
          const newValueValue = initialFields[childValueKey];
          if (fieldsRef.current[childValueKey].value !== newValueValue) {
            fieldsRef.current[childValueKey].onChange(initialFields[childValueKey]);
          }
        }

      });
    }

  }), [json, initialFields]);

  return (
    <List ordered relaxed divided>
      {_.map(json[property], (fileEntity, key) => (
        <EntityMatcher
          key={key}
          json={json}
          entity={fileEntity}
          definition={definition}
          onFieldChange={onFieldChange}
          actionField={fields[`${property}-${key}-action`]}
          valueField={fields[`${property}-${key}-value`]}
          actionOptions={actionOptions}
          valueOptions={valueOptions}
        />
      ))}
    </List>
  );
};

EntityDetails.propTypes = {
  definition: PropTypes.object.isRequired,
  json: PropTypes.object.isRequired,
  fields: PropTypes.object.isRequired,
  initialFields: PropTypes.object.isRequired,
};

EntityDetails.Header = memo(({
  definition, json, fields, initialFields,
}) => {
  const { property, title } = definition;

  const allSelected = _(json[property])
    .map(({ id }) => fields[`${property}-${id}-action`].value === actions.ignore)
    .every();

  const someErrored = _(json[property])
    .map(({ id }) => fields[`${property}-${id}-action`].errored || fields[`${property}-${id}-value`].errored)
    .some();

  const toggleEntities = (e) => {
    e.stopPropagation();
    batch(() => {
      _(json[property])
        .each(({ id }) => {
          const actionKey = `${property}-${id}-action`;
          const field = fields[actionKey];
          field.onChange(allSelected ? initialFields[actionKey] : actions.ignore);
        });
    });
  };

  return (
    <>
      <span className={cx({ 'dark-red': someErrored })}>{title}</span>
      <span className='fr'>
        <Checkbox checked={allSelected} onClick={toggleEntities} label='Ignore all' />
      </span>
    </>
  );
});

EntityDetails.Header.displayName = 'EntityDetails.Header';
EntityDetails.Header.propTypes = {
  definition: PropTypes.object.isRequired,
  json: PropTypes.object.isRequired,
  fields: PropTypes.object.isRequired,
  initialFields: PropTypes.object.isRequired,
};
