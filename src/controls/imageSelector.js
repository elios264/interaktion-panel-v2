import _ from 'lodash';
import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { Image, Header, Reveal, Dimmer } from 'semantic-ui-react';
import * as utils from './utils';


export class ImageSelector extends PureComponent {
  static propTypes = {
    disabled: PropTypes.bool.isRequired,
    imageUrl: PropTypes.string,
    onImageSelected: PropTypes.func.isRequired,
    onDelete: PropTypes.func,
  }

  onImageSelected = async () => {
    const [image] = await utils.selectImages({ multiple: false });
    return this.props.onImageSelected(image);
  }

  render() {
    const { disabled, imageUrl, onDelete, onImageSelected: ignored, ...props } = this.props;
    return (
      <Reveal disabled={disabled} animated='fade' className='z-0' {...props} style={{ pointerEvents: disabled ? 'none' : 'auto', minHeight: '180px' }}>
        <Reveal.Content visible className='w-100 bg-white flex items-center' style={{ pointerEvents: 'none', minHeight: '180px' }}>
          <Image fluid src={imageUrl || require('img/empty.png')} />
        </Reveal.Content>
        <Reveal.Content hidden className='bg-white flex items-center' style={{ minHeight: '180px' }}>
          <Image fluid src={imageUrl || require('img/empty.png')} />
          <Dimmer active={!disabled}>
            <Header className='pointer' size='tiny' inverted icon='picture' content='Select image...' onClick={this.onImageSelected} />
            {(imageUrl && onDelete) && <Header className='pointer' size='tiny' inverted icon='trash' content='Remove image' onClick={_.partial(onDelete, null)} />}
          </Dimmer>
        </Reveal.Content>
      </Reveal>
    );
  }
}
