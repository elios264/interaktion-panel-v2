/* eslint-disable react/prop-types, new-cap */

import _ from 'lodash';
import React, { useMemo, useState } from 'react';
import { createEditor, Transforms } from 'slate';
import { Slate, useSlate, withReact } from 'slate-react';
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


const headingTypes = [ELEMENT_H1, ELEMENT_H2, ELEMENT_H3, ELEMENT_H4, ELEMENT_H5, ELEMENT_H6];
const emptyDocument = [{ children: [{ type: ELEMENT_PARAGRAPH, children: [{ text: 'Start typing...' }] }] }];

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
      </Menu>

      <EditablePlugins plugins={plugins} spellCheck />
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
