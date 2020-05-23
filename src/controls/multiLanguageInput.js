import './multiLanguageInput.less';

import _ from 'lodash';
import React, { useState, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import { Input, Dropdown, TextArea } from 'semantic-ui-react';
import cx from 'classnames';
import Joi from '@hapi/joi';

import { useEffectSkipMount } from './hooks/misc';

export const languageOptions = [
  { key: 'us', text: 'English (en)', value: 'en' },
  { key: 'es', text: 'Spanish (es)', value: 'es' },
];

export const getJoiLanguagesValidationSchema = (label, length, requiredCode = window.__ENVIRONMENT__.APP_LOCALE) => Joi.object(_.transform(languageOptions, (acc, { value }) => {
  let rule = Joi.string().trim().max(length).label(`${label} (${value})`);
  if (value === requiredCode) {
    rule = rule.required();
  }
  acc[value] = rule;
}, {})).label(label).required();


export const MultiLanguageInput = ({ value, onChange, defaultLanguage, disabled, ...props }) => {
  const [currentLanguage, setCurrentLanguage] = useState(defaultLanguage);
  const onLanguageChange = useCallback((e, { value }) => setCurrentLanguage(value), [setCurrentLanguage]);
  const onChangeInLanguage = useCallback((e, { value: newValue }) => onChange(_.pickBy({ ...value, [currentLanguage]: newValue })), [currentLanguage, onChange, value]);
  const languageOptionsWithTranslation = useMemo(() => _.map(languageOptions, (props) => ({ ...props, description: _.truncate(value[props.value]) })), [value]);

  useEffectSkipMount(() => setCurrentLanguage(defaultLanguage), [disabled]);

  return (
    <Input
      action={(
        <Dropdown
          className='button-dropdown-fix-description fix-borders'
          button
          basic
          floating
          options={languageOptionsWithTranslation}
          value={currentLanguage}
          onChange={onLanguageChange}
          search
          deburr
          disabled={disabled} />
      )}
      value={value[currentLanguage] || ''}
      onChange={onChangeInLanguage}
      disabled={disabled}
      {...props} />
  );
};


MultiLanguageInput.propTypes = {
  value: PropTypes.objectOf(PropTypes.string),
  onChange: PropTypes.func.isRequired,
  defaultLanguage: PropTypes.string,
  disabled: PropTypes.bool,
};

MultiLanguageInput.defaultProps = {
  defaultLanguage: window.__ENVIRONMENT__.APP_LOCALE,
  value: {},
};

export const MultiLanguageTextArea = ({ value, onChange, className, defaultLanguage, disabled, ...props }) => {
  const [currentLanguage, setCurrentLanguage] = useState(defaultLanguage);
  const onLanguageChange = useCallback((e, { value }) => setCurrentLanguage(value), [setCurrentLanguage]);
  const onChangeInLanguage = useCallback((e, { value: newValue }) => onChange(_.pickBy({ ...value, [currentLanguage]: newValue })), [currentLanguage, onChange, value]);
  const languageOptionsWithTranslation = useMemo(() => _.map(languageOptions, (props) => ({ ...props, description: _.truncate(value[props.value]) })), [value]);

  useEffectSkipMount(() => setCurrentLanguage(defaultLanguage), [disabled]);

  return (
    <div className={cx(className, 'flex flex-column')}>
      <TextArea
        className={cx(className, 'attached-top')}
        value={value[currentLanguage] || ''}
        onChange={onChangeInLanguage}
        disabled={disabled}
        {...props} />
      <Dropdown
        className='attached-bottom button-dropdown-fix-description fix-borders'
        button
        basic
        floating
        fluid
        search
        deburr
        options={languageOptionsWithTranslation}
        value={currentLanguage}
        disabled={disabled}
        onChange={onLanguageChange} />
    </div>
  );
};


MultiLanguageTextArea.propTypes = {
  value: PropTypes.objectOf(PropTypes.string),
  onChange: PropTypes.func.isRequired,
  defaultLanguage: PropTypes.string,
  className: PropTypes.string,
  disabled: PropTypes.bool,
};

MultiLanguageTextArea.defaultProps = {
  defaultLanguage: window.__ENVIRONMENT__.APP_LOCALE,
  value: {},
};
