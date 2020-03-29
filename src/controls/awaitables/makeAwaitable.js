import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';


export const makeAwaitable = ({ event, props }) => (WrappedComponent) => {
  const Awaitable = ({ [event]: onEvent, ...extraProps }) => {
    const [awaiting, setAwaiting] = useState(false);
    const mounted = useRef(true);

    useEffect(() => () => (mounted.current = false), []);

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

    return <WrappedComponent {...{ [event]: handleEvent }} {...extraProps} {...awaitingProps} />;
  };

  Awaitable.propTypes = { [event]: PropTypes.func.isRequired };
  Awaitable.displayName = `Awaitable(${WrappedComponent.displayName || WrappedComponent.name || 'Component'})`;
  return Awaitable;
};
