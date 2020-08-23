/* eslint-disable new-cap */

import _ from 'lodash';
import React, { useMemo, useState } from 'react';
import { createEditor } from 'slate';
import { Slate, useSlate, withReact } from 'slate-react';
import { Menu, Icon } from 'semantic-ui-react';
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

  withToggleType,

  pipe,
  isMarkActive,
  isNodeTypeIn,
  toggleMark,
  upsertAlign,

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


const initialValue = [{
  type: ELEMENT_PARAGRAPH,
  children: [{
    text: 'This text is bold, italic and underlined',
    [MARK_BOLD]: true,
    [MARK_ITALIC]: true,
    [MARK_UNDERLINE]: true,
  }],
}];

const plugins = [ParagraphPlugin(), BoldPlugin(), ItalicPlugin(), UnderlinePlugin(), HighlightPlugin(), AlignPlugin(), HeadingPlugin()];
const withPlugins = [withReact, withHistory, withToggleType({ defaultType: ELEMENT_PARAGRAPH })];

export const RichTextEditor = () => {
  const [value, setValue] = useState(initialValue);
  const editor = useMemo(() => pipe(createEditor(), ...withPlugins), []);


  return (
    <Slate
      editor={editor}
      value={value}
      onChange={(newValue) => {
        setValue(newValue); console.log(newValue);
      }}>
      <Menu icon size='tiny' className='flex-wrap'>
        <MenuMark type={MARK_BOLD} icon={<Icon name='bold' />} />
        <MenuMark type={MARK_ITALIC} icon={<Icon name='italic' />} />
        <MenuMark type={MARK_UNDERLINE} icon={<Icon name='underline' />} />
        <MenuMark type={MARK_HIGHLIGHT} icon={<Icon name='paint brush' />} />
        <MenuAlign type={ELEMENT_ALIGN_LEFT} icon={<Icon name='align left' />} />
        <MenuAlign type={ELEMENT_ALIGN_CENTER} icon={<Icon name='align center' />} />
        <MenuAlign type={ELEMENT_ALIGN_RIGHT} icon={<Icon name='align right' />} />
        <MenuElement type={ELEMENT_H1} icon='H1' />
        <MenuElement type={ELEMENT_H2} icon='H2' />
        <MenuElement type={ELEMENT_H3} icon='H3' />
        <MenuElement type={ELEMENT_H4} icon='H4' />
        <MenuElement type={ELEMENT_H5} icon='H5' />
        <MenuElement type={ELEMENT_H6} icon='H6' />
      </Menu>

      <EditablePlugins plugins={plugins} placeholder='Enter some text...' spellCheck autoFocus />
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

const MenuElement = ({ type, icon }) => {
  const editor = useSlate();

  return (
    <Menu.Item
      name={type}
      onClick={_.noop}
      active={isNodeTypeIn(editor, type)}
      onMouseDown={(e) => {
        e.preventDefault();
        editor.toggleType(type);
      }}>
      {icon}
    </Menu.Item>
  );
};
