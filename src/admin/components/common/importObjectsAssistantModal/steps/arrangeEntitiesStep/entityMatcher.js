import _ from 'lodash';
import PropTypes from 'prop-types';
import { memo, useEffect } from 'react';
import { Icon, List, Label } from 'semantic-ui-react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';

import { utils, Popup, Selector } from 'controls';
import { actions } from '../../types';

export const EntityMatcher = memo(({ entity, definition, actionField, actionOptions, valueField, valueOptions, onFieldChange, json }) => {

  const storeEntities = useSelector((state) => state.objects[definition.property]);

  const onValueChange = (value) => valueField.onChange(value);
  const onActionChange = (value) => actionField.onChange(value);

  useEffect(() => {
    onFieldChange({ definition, field: 'action', entity, value: actionField.value });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actionField.value]);

  useEffect(() => {
    onFieldChange({ definition, field: 'value', entity, value: valueField.value });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [valueField.value]);

  const detailsUrl = valueField.value && _.isFunction(definition.detailsUrl)
    ? definition.detailsUrl(storeEntities[valueField.value])
    : `/${definition.property}/details/${valueField.value}`;

  return (
    <List.Item>
      <span>
        <Label size='mini' empty circular color={utils.getValue(actionField.value, { [actions.create]: 'green', [actions.update]: 'yellow', [actions.reference]: 'orange', [actions.ignore]: 'grey' })} />{' '}
        {definition.displayName(entity, json)}{' '}
        in file{' '}
        <Popup message={actionField.message} enabled={actionField.errored}>
          <Selector
            inline
            fluid={false}
            selection={false}
            placeholder='select'
            error={actionField.errored}
            options={actionOptions}
            value={actionField.value}
            onChange={onActionChange} />
        </Popup>
        {(actionField.value === actions.update || actionField.value === actions.reference) && (
          <Popup
            flowing={!valueField.errored}
            hoverable={!valueField.errored}
            enabled={valueField.errored || (detailsUrl && !_.isNil(valueField.value))}
            message={valueField.errored ? valueField.message : (
              <Link target='_blank' to={detailsUrl}>
                <Icon name='external alternate' />
                {_.replace(detailsUrl, '/', '')}
              </Link>
            )}>
            <Selector
              inline
              fluid={false}
              selection={false}
              placeholder='select'
              error={valueField.errored}
              options={valueOptions}
              value={valueField.value}
              onChange={onValueChange}
              search
              lazyLoad
              floating />
          </Popup>

        )}
      </span>
    </List.Item>
  );
});
EntityMatcher.displayName = 'EntityMatcher';
EntityMatcher.propTypes = {
  json: PropTypes.object.isRequired,
  entity: PropTypes.object.isRequired,
  definition: PropTypes.object.isRequired,
  actionField: PropTypes.object.isRequired,
  valueField: PropTypes.object.isRequired,
  actionOptions: PropTypes.array.isRequired,
  valueOptions: PropTypes.array.isRequired,
  onFieldChange: PropTypes.func.isRequired,
};
