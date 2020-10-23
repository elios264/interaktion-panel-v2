import _ from 'lodash';
import {
  createElement, useState, useEffect, useRef,
} from 'react';
import PropTypes from 'prop-types';

export const makeAwaitable = ({ event, props }) => (wrappedComponent) => {
  const Awaitable = ({ [event]: onEvent, ...extraProps }) => {
    const [awaiting, setAwaiting] = useState(false);
    const mounted = useRef(true);

    useEffect(() => () => { mounted.current = false; }, []);

    const awaitingProps = awaiting ? props : {};
    const handleEvent = async (...args) => {
      try {
        setAwaiting(true);
        return await onEvent(...args);
      } finally {
        if (mounted.current) {
          setAwaiting(false);
        }
      }
    };

    return createElement(wrappedComponent, { [event]: handleEvent, ...extraProps, ...awaitingProps });
  };

  Awaitable.propTypes = { [event]: PropTypes.func.isRequired };
  Awaitable.displayName = `Awaitable(${_.isString(wrappedComponent) ? wrappedComponent : (wrappedComponent.displayName || wrappedComponent.name || 'Component')})`;
  return Awaitable;
};
