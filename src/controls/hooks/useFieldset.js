import _ from 'lodash';
import Joi from '@hapi/joi';
import PropTypes from 'prop-types';
import { createSelector } from 'reselect';
import { useCallback, useMemo, useState, useReducer, useRef, useEffect } from 'react';

import { useEffectSkipMount, useIsMounted } from './misc';
import { delay } from 'controls/utils';

const defaultClone = (source) => _.isFunction(source.copy)
  ? source.copy()
  : _.cloneDeepWith(source, (value) => value && _.isFunction(value.copy) ? value.copy() : undefined);

const errorsReducer = (state, { type, field, value }) => {
  switch (type) {
    case 'SET_ALL': return value;
    case 'SET_VALUE': return { ...state, [field]: value };
    default: throw new Error('Invalid action');
  }
};
const sourceReducer = (state, { type, field, value }) => {
  switch (type) {
    case 'SET_ALL': return value;
    case 'SET_VALUE': return ((state[field] = value), state);
    default: throw new Error('Invalid action');
  }
};

export const useFieldset = ({
  schema,
  onSubmit,
  enabled = true,
  partial = false,
  cloneSource = defaultClone,
  source: templateSource,
  validator,
}) => {
  const validatorRef = useRef();
  const children = useRef(new Set());
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useReducer(errorsReducer, {});
  const [source, setSource] = useReducer(sourceReducer, undefined, () => (validator ? templateSource || {} : cloneSource(templateSource || {})));
  const isMounted = useIsMounted();
  const [submitValueToParentCount, submitValueToParent] = useReducer((x) => x + 1, 0);

  useEffectSkipMount(() => {
    setLoading(false);
    setErrors({ type: 'SET_ALL', value: {} });
    setSource({ type: 'SET_ALL', value: validator ? templateSource || {} : cloneSource(templateSource || {}) });
  }, [cloneSource, enabled, schema, templateSource, validator]);

  /* eslint-disable react-hooks/exhaustive-deps */
  useEffect(() => {
    if (validator) {
      validator.current.add(validatorRef);
    }
    return () => {
      if (validator) {
        validator.current.delete(validatorRef);
      }
    };
  }, []);
  /* eslint-enable react-hooks/exhaustive-deps */


  useEffect(() => {
    if (submitValueToParentCount > 0) {
      onSubmit(source);
    }
  }, [submitValueToParentCount]); // eslint-disable-line react-hooks/exhaustive-deps


  const reset = useCallback(validator ? _.noop : () => {
    setLoading(false);
    setErrors({ type: 'SET_ALL', value: {} });
    setSource({ type: 'SET_ALL', value: cloneSource(templateSource || {}) });
  }, [cloneSource, templateSource]);

  const submit = useCallback(async (e) => {
    _.invoke(onSubmit && e, 'preventDefault');
    setLoading(true);
    setErrors({ type: 'SET_ALL', value: {} });

    /* eslint-disable no-await-in-loop */
    const childrenResults = [];
    for (const childrenRef of children.current) {
      childrenResults.push(await childrenRef.current.submit());
      await delay(0); // yield execution to allow react to execute batched children results
    }
    /* eslint-enable no-await-in-loop */

    const { error, value: validatedSource } = Joi.object(schema).validate(
      source.attributes ? _.pick(source, _.keys(schema)) : source,
      { abortEarly: false, allowUnknown: true, errors: { label: false } }
    );

    if (error) {
      _.invoke(!onSubmit && e, 'preventDefault'); // cancel form submit in case of traditional form validation
      console.warn('validation failed', error.details);
      setLoading(false);
      setErrors({ type: 'SET_ALL', value: _.transform(error.details, (errors, { path: [key], message }) => (errors[key] = message), {}) });
      return false;
    } else if (!onSubmit) { // no need to do more work in case of a traditional form validation
      return true;
    }

    if (_.some(childrenResults, (result) => result === false)) { // children fieldsets might have stricter validations than the parent fieldset
      setLoading(false);
      return false;
    }

    let newSource = source;
    if (source.attributes) { // parse objects need to have their fields set manually
      const setProps = _.pickBy(validatedSource, (value, key) => (_.isUndefined(value) ? false : newSource[key] !== value || newSource.dirty(key)));
      const unsetProps = _.difference(_.keys(schema), _.keys(validatedSource));
      _.each(setProps, (prop, key) => (newSource[key] = prop));
      _.each(unsetProps, (key) => (newSource[key] = undefined));
    } else {
      newSource = _.pickBy(validatedSource, _.negate(_.isUndefined));
    }

    const success = await onSubmit(newSource);

    if (isMounted.current) {
      setLoading(false);
      setErrors({ type: 'SET_ALL', value: {} });
    }

    return success;
  }, [onSubmit, schema, source, isMounted]);

  const fields = _.mapValues(
    useMemo(() => _.mapValues(schema, (ignored, field) => createSelector(
      _.iteratee('value'), _.iteratee('error'), _.iteratee('enabled'),
      (currentValue, error, enabled) => ({
        value: currentValue,
        message: error,
        errored: !!error,
        onChange: !enabled ? _.noop : (value, { value: maybeValue, checked: maybeValue2 } = {}) => {
          const newVal = _.has(value, 'target.value') ? value.target.value : _.has(value, 'target.checked') ? value.target.checked : !_.isUndefined(maybeValue) ? maybeValue : (!_.isUndefined(maybeValue2) ? maybeValue2 : value);
          setSource({ type: 'SET_VALUE', field, value: newVal });
          setErrors({ type: 'SET_VALUE', field, value: undefined });
          if (validator) {
            submitValueToParent();
          }
          return true;
        },
      }))), [schema, validator]),
    (creator, field) => creator({ enabled, value: source[field], error: errors[field] })
  );

  validatorRef.current = useMemo(() => ({
    add: (ref) => children.current.add(ref),
    delete: (ref) => children.current.delete(ref),
    submit: validator ? submit : undefined,
  }), [submit, validator]);

  return {
    fields,
    loading,
    validator: validatorRef,
    reset: enabled ? reset : _.noop,
    submit: enabled ? submit : _.noop,
    partial: partial ? cloneSource(source) : undefined,
  };
};

useFieldset.fieldProp = PropTypes.exact({
  onChange: PropTypes.func.isRequired,
  message: PropTypes.string,
  errored: PropTypes.bool.isRequired,
  value: PropTypes.any,
});
