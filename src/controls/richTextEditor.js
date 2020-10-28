/* eslint-disable react/prop-types, new-cap */

import _ from 'lodash';
import cx from 'classnames';
import {
  createContext, useMemo, useState, useContext,
} from 'react';
import PropTypes from 'prop-types';
import { createEditor, Transforms } from 'slate';
import {
  Slate, useSlate, withReact, useSelected, useReadOnly,
} from 'slate-react';
import {
  Menu, Icon, Dropdown, Loader,
} from 'semantic-ui-react';
import { withHistory } from 'slate-history';
import {
  ParagraphPlugin,
  BoldPlugin,
  EditablePlugins,
  ItalicPlugin,
  UnderlinePlugin,
  AlignPlugin,
  HeadingPlugin,
  ListPlugin,
  BlockquotePlugin,
  SoftBreakPlugin,
  ExitBreakPlugin,
  ResetBlockTypePlugin,
  LinkPlugin,
  MediaEmbedPlugin,

  withToggleType,
  withList,
  withTrailingNode,
  withTransforms,
  withLink,
  withInlineVoid,

  pipe,
  isUrl,
  isMarkActive,
  isNodeTypeIn,
  toggleMark,
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
} from '@udecode/slate-plugins';

import { File, Resource } from 'objects';
import * as utils from './utils';
import { languageOptions } from './multiLanguageInput';
import { useEffectSkipMount } from './hooks/misc';
import { makeAwaitable } from './awaitables';

const AwaitableDropdownItem = makeAwaitable({ event: 'onMouseDown', props: { icon: <Loader active inline size='tiny' className='icon' /> } })(Dropdown.Item);
const ResourcesContext = createContext({});

const ImageElement = ({
  attributes, className, children, element,
}) => {
  const resources = useContext(ResourcesContext);
  const selected = useSelected();
  const readOnly = useReadOnly();

  const image = resources[element.resource] || {};
  return (
    <div {...attributes} className={cx(className, 'flex justify-center')}>
      <a contentEditable={false} target='_blank' rel='noreferrer' className='pointer' href={readOnly ? image.fileUrl : undefined}>
        <img src={image.fileUrl || require('img/empty.png')} alt={image.fileName || 'Not found'} className={cx('db pv2 ph0', { 'ba b--green bw1': selected })} style={{ maxHeight: '20em' }} />
      </a>
      {children}
    </div>
  );
};
const ImagePlugin = () => ({
  renderElement: getRenderElement({ component: ImageElement, type: 'img', rootProps: { className: 'slate-img' } }),
  deserialize: { element: getNodeDeserializer({ type: 'img', rules: [{ nodeNames: 'IMG' }] }) },
  voidTypes: ['img'],
});

const AttachmentElement = ({
  attributes, className, children, element,
}) => {
  const selected = useSelected();
  const readOnly = useReadOnly();

  const resources = useContext(ResourcesContext);
  const attachment = resources[element.resource] || {};

  const getFileIcon = (fileExtension) => {
    switch (fileExtension) {
      case '.xlsx': return 'file excel outline';
      case '.jpg': case '.png': case '.svg': case '.jpeg': case '.bmp': return 'file image outline';
      case '.doc': case '.docx': return 'file word outline';
      case '.pdf': return 'file pdf outline';
      case '.pptx': case '.ppt': return 'file powerpoint outline';
      case '.zip': return 'file archive outline';
      case '.mp3': case '.m4a': return 'file audio outline';
      case '.js': case '.java': case '.php': case '.less': case '.css': return 'file code outline';
      case '.txt': return 'file alternate outline';
      default: return 'file outline';
    }
  };

  const formatFileSize = (size) => {
    if (!size) {
      return '';
    }

    if (size <= 1024 * 1024) {
      return `${_.round(size / 1024, 2)} Kb.`;
    }
    return `${_.round(size / (1024 * 1024), 2)} Mb.`;
  };

  return (
    <div {...attributes} className={cx(className, 'flex justify-center')}>
      <a contentEditable={false} target='_blank' rel='noreferrer' className={`${cx({ 'bg-light-gray bw1': selected })} pointer black flex items-center flex-column flex-row-ns pa3 mv2 m ba b--light-gray w-100 w-50-ns br2`} href={readOnly ? attachment.fileUrl : undefined}>
        <Icon color='black' name={getFileIcon(attachment.fileExtension)} size='huge' />
        <div className='ml3 flex-auto mt3 mt0-ns'>
          <div className='gray' style={{ wordBreak: 'break-all' }}>{attachment.fileName || `Filename with id ${attachment.id} not found`}</div>
          <div className='flex justify-between mt2'>
            <div className='gray b'>{formatFileSize(attachment.fileSize)}</div>
            <div>
              {' '}
              <Icon name='cloud download' color='black' size='small' />
            </div>
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
      }}
    >
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
      }}
    >
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
      }}
    >
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
      }}
    >
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
        upsertLinkAtSelection(editor, url);
      }}
    >
      <Icon name='linkify' />
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
      }}
    >
      <Icon name='minus' />
    </Menu.Item>
  );
};

const MenuMedia = ({ resources, saveResource }) => {
  const editor = useSlate();

  return (
    <Dropdown item simple icon='attach'>
      <Dropdown.Menu>
        <AwaitableDropdownItem
          icon='image'
          content='Image'
          onMouseDown={async (e) => {
            e.preventDefault();

            const src = await utils.selectImages({ multiple: false }).then(([file]) => File.fromNativeFile(file));
            const image = _.find(resources, ['fileHash', src.localHash]) || new Resource({ src });
            if (!image.id) {
              const success = await saveResource(image);
              if (!success) { return; }
            }
            Transforms.insertNodes(editor, { type: 'img', resource: image.id, children: [{ text: '' }] });
          }}
        />
        <Dropdown.Item
          icon='video'
          content='Video'
          onMouseDown={(e) => {
            e.preventDefault();
            const url = window.prompt('Enter the URL of the media embed:'); // eslint-disable-line no-alert
            if (isUrl(url)) {
              Transforms.insertNodes(editor, { type: ELEMENT_MEDIA_EMBED, url, children: [{ text: '' }] });
            }
          }}
        />
        <AwaitableDropdownItem
          icon='attach'
          content='Attachment'
          onMouseDown={async (e) => {
            e.preventDefault();

            const src = await utils.selectFiles({ multiple: false }).then(([file]) => File.fromNativeFile(file));
            const attachment = _.find(resources, ['fileHash', src.localHash]) || new Resource({ src });
            if (!attachment.id) {
              const success = await saveResource(attachment);
              if (!success) { return; }
            }
            Transforms.insertNodes(editor, { type: 'attachment', resource: attachment.id, children: [{ text: '' }] });
          }}
        />
      </Dropdown.Menu>
    </Dropdown>
  );
};

const headingTypes = [ELEMENT_H1, ELEMENT_H2, ELEMENT_H3, ELEMENT_H4, ELEMENT_H5, ELEMENT_H6];
const emptyDocument = [{ children: [{ type: ELEMENT_PARAGRAPH, children: [{ text: '' }] }] }];

const plugins = [
  ParagraphPlugin({ p: { rootProps: { className: 'slate-p ma0' } } }),
  BlockquotePlugin(),
  HeadingPlugin(),
  ListPlugin(),
  AlignPlugin(),
  BoldPlugin(),
  ItalicPlugin(),
  UnderlinePlugin(),
  LinkPlugin(),
  MediaEmbedPlugin(),
  ImagePlugin(),
  DividerPlugin(),
  AttachmentPlugin(),
  ResetBlockTypePlugin({
    rules: [{
      types: [ELEMENT_BLOCKQUOTE], defaultType: ELEMENT_PARAGRAPH, hotkey: 'Enter', predicate: isBlockAboveEmpty,
    }, {
      types: [ELEMENT_BLOCKQUOTE], defaultType: ELEMENT_PARAGRAPH, hotkey: 'Backspace', predicate: isSelectionAtBlockStart,
    }],
  }),
  SoftBreakPlugin({
    rules: [
      { hotkey: 'shift+enter' },
      { hotkey: 'enter', query: { allow: [ELEMENT_BLOCKQUOTE] } },
    ],
  }),
  ExitBreakPlugin({
    rules: [
      { hotkey: 'mod+enter' },
      { hotkey: 'mod+shift+enter', before: true },
      { hotkey: 'enter', query: { start: true, end: true, allow: headingTypes } },
    ],
  }),
];

const withPlugins = [
  withReact,
  withHistory,
  withLink(),
  withList(),
  withToggleType({ defaultType: ELEMENT_PARAGRAPH }),
  withTransforms(),
  withInlineVoid({ plugins }),
  withTrailingNode({ type: ELEMENT_PARAGRAPH, level: 1 }),
];

export const RichTextEditor = ({
  value, onChange, defaultLanguage, disabled, placeholder, resources, saveResource, ...props
}) => {
  const editor = useMemo(() => pipe(createEditor(), ...withPlugins), []);

  const [currentLanguage, setCurrentLanguage] = useState(defaultLanguage);
  const [document, setDocument] = useState(() => value[currentLanguage] || emptyDocument);

  useEffectSkipMount(() => setCurrentLanguage(defaultLanguage), [disabled]);
  useEffectSkipMount(() => {
    const newDoc = value[currentLanguage] || emptyDocument;
    if (newDoc !== document) {
      Transforms.deselect(editor);
      setDocument(newDoc);
    }
  }, [value, currentLanguage]);

  const onLanguageChange = (e, { value: selectedLanguage }) => setCurrentLanguage(selectedLanguage);
  const onDocumentChange = (newDocument) => {
    if (document === newDocument) {
      return;
    }
    setDocument(newDocument);
    onChange({ ...value, [currentLanguage]: newDocument });
  };

  return (
    <div {...props}>
      <ResourcesContext.Provider value={resources}>
        <Slate
          editor={editor}
          value={document}
          onChange={onDocumentChange}
        >
          {!disabled && (
            <Menu icon size='tiny' className='flex-wrap'>
              <MenuMark type={MARK_BOLD} icon={<Icon name='bold' />} />
              <MenuMark type={MARK_ITALIC} icon={<Icon name='italic' />} />
              <MenuMark type={MARK_UNDERLINE} icon={<Icon name='underline' />} />
              <MenuSize />
              <MenuElement type={ELEMENT_BLOCKQUOTE} icon={<Icon name='quote right' />} />
              <MenuAlign type={ELEMENT_ALIGN_LEFT} icon={<Icon name='align left' />} />
              <MenuAlign type={ELEMENT_ALIGN_CENTER} icon={<Icon name='align center' />} />
              <MenuAlign type={ELEMENT_ALIGN_RIGHT} icon={<Icon name='align right' />} />
              <MenuList type={ELEMENT_UL} icon={<Icon name='list ul' />} />
              <MenuLink />
              <MenuMedia resources={resources} saveResource={saveResource} />
              <MenuDivider />
              <Dropdown
                item
                floating
                options={languageOptions}
                value={currentLanguage}
                onChange={onLanguageChange}
              />
            </Menu>
          )}
          <EditablePlugins plugins={plugins} spellCheck placeholder={placeholder} readOnly={disabled} />
        </Slate>
      </ResourcesContext.Provider>
    </div>
  );
};

RichTextEditor.propTypes = {
  value: PropTypes.objectOf(PropTypes.array),
  onChange: PropTypes.func.isRequired,
  defaultLanguage: PropTypes.string,
  disabled: PropTypes.bool,
  placeholder: PropTypes.string,
  resources: PropTypes.object.isRequired,
  saveResource: PropTypes.func.isRequired,
};

RichTextEditor.defaultProps = {
  defaultLanguage: window.__ENVIRONMENT__.APP_LOCALE,
  value: {},
};
