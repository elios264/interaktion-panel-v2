import _ from 'lodash';
import React, { useCallback } from 'react';
import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';

import { Resource, File } from 'objects';
import { ImageSelector } from 'controls';

export const ResourceImageSelector = React.memo(({ disabled, value, onChange }) => {
  const resources = useSelector((state) => state.objects.resources);

  const onImageSelected = useCallback(async (file) => {
    const src = await File.fromNativeFile(file);
    const existingResource = _.find(resources, ['fileHash', src.localHash]);
    return onChange(existingResource || new Resource({ src }));
  }, [resources, onChange]);

  return (
    <ImageSelector
      disabled={disabled}
      imageUrl={_.get(resources[_.get(value, 'id')] || value, 'fileUrl')}
      onImageSelected={onImageSelected}
      onDelete={onChange} />
  );

});

ResourceImageSelector.displayName = 'ResourceImageSelector';
ResourceImageSelector.propTypes = {
  disabled: PropTypes.bool,
  value: PropTypes.instanceOf(Resource),
  onChange: PropTypes.func,
};
