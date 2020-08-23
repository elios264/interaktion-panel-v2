/* eslint-disable react/prop-types, new-cap */

import _ from 'lodash';
import cx from 'classnames';
import React, { useMemo, useState } from 'react';
import { createEditor, Transforms } from 'slate';
import { Slate, useSlate, withReact, useSelected } from 'slate-react';
import { Menu, Icon, Dropdown } from 'semantic-ui-react';
import { withHistory } from 'slate-history';
import {
  ParagraphPlugin,
  BoldPlugin,
  EditablePlugins,
  ItalicPlugin,
  UnderlinePlugin,
  HighlightPlugin,
  AlignPlugin,
  HeadingPlugin,
  ListPlugin,
  BlockquotePlugin,
  SoftBreakPlugin,
  ExitBreakPlugin,
  ResetBlockTypePlugin,
  LinkPlugin,
  MediaEmbedPlugin,
  ImagePlugin,

  withToggleType,
  withList,
  withTrailingNode,
  withTransforms,
  withLink,
  withInlineVoid,
  withImageUpload,

  pipe,
  isUrl,
  isMarkActive,
  isNodeTypeIn,
  toggleMark,
  insertImage,
  upsertAlign,
  upsertLinkAtSelection,
  toggleList,
  isBlockAboveEmpty,
  isSelectionAtBlockStart,
  getNodeDeserializer,
  getRenderElement,

  ELEMENT_MEDIA_EMBED,
  ELEMENT_LINK,
  ELEMENT_BLOCKQUOTE,
  ELEMENT_UL,
  ELEMENT_H1,
  ELEMENT_H2,
  ELEMENT_H3,
  ELEMENT_H4,
  ELEMENT_H5,
  ELEMENT_H6,
  ELEMENT_ALIGN_LEFT,
  ELEMENT_ALIGN_CENTER,
  ELEMENT_ALIGN_RIGHT,
  ELEMENT_PARAGRAPH,
  MARK_ITALIC,
  MARK_BOLD,
  MARK_UNDERLINE,
  MARK_HIGHLIGHT,
} from '@udecode/slate-plugins';

import * as utils from './utils';
import { File, Resource } from 'objects';

const AttachmentElement = ({ attributes, className, children, element }) => {
  const selected = useSelected();
  const { attachment } = element;

  const getFileIcon = (fileExtension) => {
    switch (fileExtension) {
      case '.xlsx': return 'file excel outline';
      case '.jpg': case '.png': case '.svg': case '.jpeg': case '.bmp': return 'file image outline';
      case '.doc': case '.docx': return 'file word outline';
      case '.pdf': return 'file pdf outline';
      case '.pptx': case '.ppt': return 'file powerpoint outline';
      case '.zip': return 'file archive outline';
      case '.mp3': case '.m4a': return 'file audio outline';
      case '.js': case '.java': case '.php': case '.less' : case '.css' : return 'file code outline';
      case '.txt' : return 'file alternate outline';
      default: return 'file outline';
    }
  };

  const formatFileSize = (size) => {
    if (size <= 1024 * 1024) {
      return `${_.round(size / 1024, 2)} Kb.`;
    }
    return `${_.round(size / (1024 * 1024), 2)} Mb.`;
  };

  return (
    <div {...attributes} className={cx(className, 'flex justify-center')} contentEditable={false}>
      <a target='_blank' className={`${cx({ 'bg-light-gray bw1': selected })} pointer black flex items-center flex-column flex-row-ns ph3 pv3 ba b--light-gray w-100 w-50-ns br2`} onClick={(e) => e.preventDefault()}>
        <Icon color='black' name={getFileIcon(attachment.fileExtension)} size='huge' />
        <div className='ml3 flex-auto mt3 mt0-ns'>
          <div className='gray' style={{ wordBreak: 'break-all' }}>{attachment.fileName}</div>
          <div className='flex justify-between mt2'>
            <div className='gray b'>{formatFileSize(attachment.fileSize)}</div>
            <div> <Icon name='cloud download' color='black' size='small' /></div>
          </div>
        </div>
      </a>
      {children}
    </div>
  );
};

const AttachmentPlugin = () => ({
  renderElement: getRenderElement({ component: AttachmentElement, type: 'attachment', rootProps: { className: 'slate-attachment' } }),
  deserialize: { element: getNodeDeserializer({ type: 'attachment', rules: [{ nodeNames: 'ATTACHMENT' }] }) },
  voidTypes: ['attachment'],
});

const DividerElement = ({ attributes, className, children }) => {
  const selected = useSelected();
  return (
    <div {...attributes} className={cx(className, 'mv3 bw1 bb mh3', { 'b--black': selected, 'b--moon-gray': !selected })} contentEditable={false}>{children}</div>
  );
};

const DividerPlugin = () => ({
  renderElement: getRenderElement({ component: DividerElement, type: 'divider', rootProps: { className: 'slate-divider' } }),
  deserialize: { element: getNodeDeserializer({ type: 'divider', rules: [{ nodeNames: 'DIVIDER' }] }) },
  voidTypes: ['divider'],
});


const headingTypes = [ELEMENT_H1, ELEMENT_H2, ELEMENT_H3, ELEMENT_H4, ELEMENT_H5, ELEMENT_H6];
const emptyDocument = [{ children: [{ type: ELEMENT_PARAGRAPH, children: [{ text: '' }] }] }];

const plugins = [
  ParagraphPlugin(),
  BlockquotePlugin(),
  HeadingPlugin(),
  ListPlugin(),
  AlignPlugin(),
  BoldPlugin(),
  ItalicPlugin(),
  HighlightPlugin(),
  UnderlinePlugin(),
  LinkPlugin(),
  MediaEmbedPlugin(),
  ImagePlugin(),
  DividerPlugin(),
  AttachmentPlugin(),
  ResetBlockTypePlugin({ rules: [
    { types: [ELEMENT_BLOCKQUOTE], defaultType: ELEMENT_PARAGRAPH, hotkey: 'Enter', predicate: isBlockAboveEmpty },
    { types: [ELEMENT_BLOCKQUOTE], defaultType: ELEMENT_PARAGRAPH, hotkey: 'Backspace', predicate: isSelectionAtBlockStart },
  ] }),
  SoftBreakPlugin({ rules: [
    { hotkey: 'shift+enter' },
    { hotkey: 'enter', query: { allow: [ELEMENT_BLOCKQUOTE] } },
  ] }),
  ExitBreakPlugin({ rules: [
    { hotkey: 'mod+enter' },
    { hotkey: 'mod+shift+enter', before: true },
    { hotkey: 'enter', query: { start: true, end: true, allow: headingTypes } },
  ] }),
];

const withPlugins = [
  withReact,
  withHistory,
  withLink(),
  withList(),
  withToggleType({ defaultType: ELEMENT_PARAGRAPH }),
  withTransforms(),
  withTrailingNode({ type: ELEMENT_PARAGRAPH, level: 1 }),
  withImageUpload(),
  withInlineVoid({ plugins }),
];

export const RichTextEditor = () => {
  const [value, setValue] = useState(emptyDocument);
  const editor = useMemo(() => pipe(createEditor(), ...withPlugins), []);

  return (
    <Slate
      editor={editor}
      value={value}
      onChange={(newValue) => (console.log(newValue), setValue(newValue))}>
      <Menu icon size='tiny' className='flex-wrap'>
        <MenuMark type={MARK_BOLD} icon={<Icon name='bold' />} />
        <MenuMark type={MARK_ITALIC} icon={<Icon name='italic' />} />
        <MenuMark type={MARK_UNDERLINE} icon={<Icon name='underline' />} />
        <MenuMark type={MARK_HIGHLIGHT} icon={<Icon name='paint brush' />} />
        <MenuSize />
        <MenuElement type={ELEMENT_BLOCKQUOTE} icon={<Icon name='quote right' />} />
        <MenuAlign type={ELEMENT_ALIGN_LEFT} icon={<Icon name='align left' />} />
        <MenuAlign type={ELEMENT_ALIGN_CENTER} icon={<Icon name='align center' />} />
        <MenuAlign type={ELEMENT_ALIGN_RIGHT} icon={<Icon name='align right' />} />
        <MenuList type={ELEMENT_UL} icon={<Icon name='list ul' />} />
        <MenuLink />
        <MenuImage />
        <MenuVideo />
        <MenuDivider />
        <MenuAttachment />
      </Menu>
      <EditablePlugins plugins={plugins} spellCheck placeholder='Enter your text here...' />
    </Slate>
  );
};

const MenuMark = ({ type, icon, clear }) => {
  const editor = useSlate();

  return (
    <Menu.Item
      name={type}
      onClick={_.noop}
      active={isMarkActive(editor, type)}
      onMouseDown={(e) => {
        e.preventDefault();
        toggleMark(editor, type, clear);
      }}>
      {icon}
    </Menu.Item>
  );
};
const MenuElement = ({ type, icon }) => {
  const editor = useSlate();

  return (
    <Menu.Item
      name={type}
      onClick={_.noop}
      active={isMarkActive(editor, type)}
      onMouseDown={(e) => {
        e.preventDefault();
        editor.toggleType(type);
      }}>
      {icon}
    </Menu.Item>
  );
};
const MenuAlign = ({ type, icon }) => {
  const editor = useSlate();

  return (
    <Menu.Item
      name={type}
      onClick={_.noop}
      active={isNodeTypeIn(editor, type)}
      onMouseDown={(e) => {
        e.preventDefault();
        upsertAlign(editor, { type });
      }}>
      {icon}
    </Menu.Item>
  );
};
const MenuSize = () => {
  const editor = useSlate();

  const onChangeSize = (e, type) => {
    e.preventDefault();
    editor.toggleType(type);
  };

  return (
    <Dropdown item simple icon='font'>
      <Dropdown.Menu>
        {_.map(headingTypes, (type) => <Dropdown.Item key={type} content={_.toUpper(type)} selected={isNodeTypeIn(editor, type)} onMouseDown={_.partialRight(onChangeSize, type)} />)}
      </Dropdown.Menu>
    </Dropdown>
  );
};
const MenuList = ({ type, icon }) => {
  const editor = useSlate();

  return (
    <Menu.Item
      name={type}
      onClick={_.noop}
      active={isNodeTypeIn(editor, type)}
      onMouseDown={(e) => {
        e.preventDefault();
        toggleList(editor, { typeList: type });
      }}>
      {icon}
    </Menu.Item>
  );
};
const MenuLink = () => {
  const editor = useSlate();

  return (
    <Menu.Item
      name='link'
      onClick={_.noop}
      active={isNodeTypeIn(editor, ELEMENT_LINK)}
      onMouseDown={(e) => {
        e.preventDefault();
        const url = window.prompt('Enter the URL of the link:'); // eslint-disable-line no-alert
        if (isUrl(url)) {
          upsertLinkAtSelection(editor, url);
        }
      }}>
      <Icon name='linkify' />
    </Menu.Item>
  );
};
const MenuVideo = () => {
  const editor = useSlate();

  return (
    <Menu.Item
      name='video'
      onClick={_.noop}
      active={isNodeTypeIn(editor, ELEMENT_MEDIA_EMBED)}
      onMouseDown={(e) => {
        e.preventDefault();
        const url = window.prompt('Enter the URL of the media embed:'); // eslint-disable-line no-alert
        if (isUrl(url)) {
          Transforms.insertNodes(editor, { type: ELEMENT_MEDIA_EMBED, url, children: [{ text: '' }] });
        }
      }}>
      <Icon name='video' />
    </Menu.Item>
  );
};
const MenuImage = () => {
  const editor = useSlate();

  return (
    <Menu.Item
      name='image'
      onClick={_.noop}
      onMouseDown={async (e) => {
        e.preventDefault();
        const [image] = await utils.selectImages({ multiple: false });
        insertImage(editor, image.base64);
      }}>
      <Icon name='image' />
    </Menu.Item>
  );
};

const MenuDivider = () => {
  const editor = useSlate();

  return (
    <Menu.Item
      name='divider'
      onClick={_.noop}
      onMouseDown={(e) => {
        e.preventDefault();
        Transforms.insertNodes(editor, { type: 'divider', children: [{ text: '' }] });
      }}>
      <Icon name='minus' />
    </Menu.Item>
  );
};

const MenuAttachment = () => {
  const editor = useSlate();

  return (
    <Menu.Item
      name='attachment'
      onClick={_.noop}
      onMouseDown={async (e) => {
        e.preventDefault();
        const files = await utils.selectFiles({ multiple: false });
        const attachment = new Resource({ src: await File.fromNativeFile(files[0]) });
        Transforms.insertNodes(editor, { type: 'attachment', attachment, children: [{ text: '' }] });
      }}>
      <Icon name='attach' />
    </Menu.Item>
  );
};