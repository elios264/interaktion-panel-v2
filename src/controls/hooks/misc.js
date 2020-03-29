import _ from 'lodash';
import { useEffect, useCallback, useRef, useMemo, useState } from 'react';
import { useDispatch } from 'react-redux';


export const useAsyncSubmit = (onAccept, onCancel) => useCallback(async (...args) => {
  const result = await onAccept(...args);
  if (result) {
    onCancel(result);
  }
  return result;
}, [onAccept, onCancel]);

export const useEffectAsync = (asyncFn, deps) => useEffect(() => {
  asyncFn();
// eslint-disable-next-line react-hooks/exhaustive-deps
}, deps);

export const useDispatchCallback = (actionCreator, ...bindArgs) => {
  const dispatch = useDispatch();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useCallback((...args) => dispatch(actionCreator(...bindArgs, ...args)), [dispatch, actionCreator, ...bindArgs]);
};

export const useIsMount = () => {
  const [isMount, setIsMount] = useState(true);
  useEffect(() => {
    setIsMount(false);
  }, []);
  return isMount;
};

export const useIsMounted = () => {
  const isMountedRef = useRef(true);
  useEffect(() => () => (isMountedRef.current = false), []);
  return isMountedRef;
};

export const useEffectSkipMount = (fn, deps) => {
  const isMount = useIsMount();

  useEffect(() => {
    if (isMount) {
      return;
    }
    fn();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
};


export const useDebounce = (fn, delay) => useMemo(() => {
  const debouncedFn = _.debounce(fn, delay);
  const eventPersistentFn = (fst, ...args) => {
    _.invoke(fst, 'persist');
    return debouncedFn(fst, ...args);
  };
  eventPersistentFn.flush = () => debouncedFn.flush();
  return eventPersistentFn;
}, [fn, delay]);

export const useCompare = (propName, value) => {
  const ref = useRef(value);
  useEffect(() => {
    ref.current = value;
  });

  const prevVal = ref.current;
  if (prevVal !== value) {
    console.log(`${propName} has different values`, prevVal, value);
  }
};
