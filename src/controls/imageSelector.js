import _ from 'lodash';
import React, { useCallback } from 'react';
import PropTypes from 'prop-types';
import { Image, Header, Reveal, Dimmer } from 'semantic-ui-react';

import * as utils from './utils';

export const ImageSelector = ({ disabled, imageUrl, onDelete, onImageSelected, ...props }) => {

  const selectImage = useCallback(async () => {
    const [image] = await utils.selectImages({ multiple: false });
    return onImageSelected(image);
  }, [onImageSelected]);

  return (
    <Reveal disabled={disabled} animated='fade' className='z-0' {...props} style={{ pointerEvents: disabled ? 'none' : 'auto', minHeight: '180px' }}>
      <Reveal.Content visible className='w-100 bg-white flex items-center' style={{ pointerEvents: 'none', minHeight: '180px' }}>
        <Image fluid src={imageUrl || require('img/empty.png')} />
      </Reveal.Content>
      <Reveal.Content hidden className='bg-white flex items-center' style={{ minHeight: '180px' }}>
        <Image fluid src={imageUrl || require('img/empty.png')} />
        <Dimmer active={!disabled}>
          <Header className='pointer' size='tiny' inverted icon='picture' content='Select image...' onClick={selectImage} />
          {(imageUrl && onDelete) && <Header className='pointer' size='tiny' inverted icon='trash' content='Remove image' onClick={_.partial(onDelete, null)} />}
        </Dimmer>
      </Reveal.Content>
    </Reveal>
  );
};

ImageSelector.propTypes = {
  disabled: PropTypes.bool.isRequired,
  imageUrl: PropTypes.string,
  onImageSelected: PropTypes.func.isRequired,
  onDelete: PropTypes.func,
};
