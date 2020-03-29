import _ from 'lodash';
import { useCallback } from 'react';
import { useSelector } from 'react-redux';
import { imageRenderer } from 'controls/table';

export const useResourceImageRenderer = () => {
  const resources = useSelector((state) => state.objects.resources);
  return useCallback(({ cellData, columnData }) => {
    const imageUrl = _.get(resources[_.get(cellData, 'id')], 'thumb');
    return imageRenderer({ columnData, cellData: imageUrl });
  }, [resources]);
};
