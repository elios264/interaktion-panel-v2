import _ from 'lodash';
import PropTypes from 'prop-types';
import { useState } from 'react';

import { delay } from './utils';
import { useEffectAsync, useIsMounted } from './hooks';

export const LoadingDots = ({
  interval, maxChars, char, prefix,
}) => {
  const [count, setCount] = useState(0);
  const isMounted = useIsMounted();

  useEffectAsync(async () => {
    await delay(interval);
    if (isMounted.current) {
      setCount(count >= maxChars ? 0 : count + 1);
    }
  }, [count]);

  return prefix + _.repeat(char, count);
};

LoadingDots.propTypes = {
  prefix: PropTypes.string,
  char: PropTypes.string,
  interval: PropTypes.number,
  maxChars: PropTypes.number,
};

LoadingDots.defaultProps = {
  prefix: '',
  char: '.',
  interval: 200,
  maxChars: 4,
};
