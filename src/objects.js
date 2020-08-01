/* eslint brace-style: ["error", "1tbs", { "allowSingleLine": true }]*/
import _ from 'lodash';
import Parse from 'parse';
import path from 'path';
import { Buffer } from 'buffer';
import { getValue, getMD5Base64Hash, loadImageBase64FromFile } from 'controls/utils';


const isEmpty = (val) => (_.isPlainObject(val) ? _.isEmpty(val) : _.isNil(val) || val === '');
const toFullJSON = (object) => object['_toFullJSON']();
const copy = (object) => {
  const jsonObj = toFullJSON(object);
  const newObj = BaseObject.fromJSON(jsonObj);
  return object.id ? newObj : newObj.clone();
};

export class BaseObject extends Parse.Object {
  setAttr(prop, value) { return isEmpty(value) ? super.unset(prop) : super.set(prop, value); }
  copy() { return copy(this); }
  toFullJSON() { return toFullJSON(this); }
  static toFullJSON = toFullJSON;
  static copy = copy
}

export class File extends Parse.File {
  static getFileName = _.flow(_.partialRight(_.replace, /\.[^/.]+$/, ''), _.camelCase)
  static fromNativeFile = async (file) => {
    if (!file.base64) {
      file.base64 = await loadImageBase64FromFile(file).then((image) => image.src);
    }
    const name = File.getFileName(file.name);
    const fileObject = new File(name, { base64: file.base64 }, file.type);
    fileObject.localName = name;
    fileObject.localUrl = file.base64;
    fileObject.localSize = file.base64.length * 0.75;
    fileObject.localHash = await fileObject
      .getData()
      .then((base64) => Uint8Array.from(atob(base64), (c) => c.charCodeAt(0)))
      .then((dataArray) => getMD5Base64Hash(Buffer.from(dataArray)));
    return fileObject;
  }
}

export class User extends Parse.User {

  setAttr(prop, value) { return isEmpty(value) ? super.unset(prop) : super.set(prop, value); }

  get name() { return this.get('name'); }
  set name(value) { this.setAttr('name', value); }

  get email() { return this.getEmail(); }
  set email(value) { this.setAttr('email', value); }

  get photo() { return this.get('photo'); }
  set photo(value) { this.setAttr('photo', value); }

  get role() { return this.get('role'); }
  set role(value) { this.setAttr('role', value); }

  get lastActivity() { return this.get('lastActivity'); }
  get sessionToken() { return this.getSessionToken(); }

  copy() { return copy(this); }

  static withSessionToken = (user, token) => {
    user = BaseObject.toFullJSON(user);
    user.sessionToken = token;
    return BaseObject.fromJSON(user);
  }
}

export class Config extends BaseObject {

  constructor(attributes) { super('Config', attributes); }
  get name() { return this.get('name'); }
  get stringValue() { return this.get('value'); }

  get visibility() { return this.get('visibility'); }
  set visibility(value) { this.setAttr('visibility', value); }

  get value() { return JSON.parse(this.get('value')); }
  set value(value) { this.setAttr('value', JSON.stringify(value)); }

  static create(name, attributes, visibility) { return new Config({ name, visibility, value: JSON.stringify(attributes) }); }
}

export class Resource extends BaseObject {
  constructor(attributes) { super('Resource', attributes); }

  get src() { return this.get('src'); }
  set src(value) { this.setAttr('src', value); }

  get desc() { return this.get('desc'); }
  set desc(value) { this.setAttr('desc', value); }

  get refs() { return this.get('refs'); }
  set refs(value) { this.setAttr('refs', value); }

  get metadata() { return this.get('metadata'); }
  set metadata(value) { this.setAttr('metadata', value); }

  get thumbnail() { return this.get('thumbnail'); }
  set thumbnail(value) { this.setAttr('thumbnail', value); }

  get fileUrl() { return _.get(this.src, 'localUrl', _.result(this.src, 'url')); }
  get fileName() { return _.get(this.src, 'localName', _.replace(_.result(this.src, 'name'), /^[a-zA-Z0-9]*_/, '')); }
  get fileExtension() { return path.extname(this.fileName); }
  get fileSize() { return _.get(this.src, 'localSize', _.get(this.metadata, 'size')); }
  get fileHash() { return _.get(this.src, 'localHash', _.get(this.metadata, 'hash')); }

  get thumb() { return _.result(this.thumbnail, 'url', this.fileUrl); }
}

export class EventLog extends BaseObject {
  constructor(attributes) { super('EventLog', attributes); }

  get timestamp() { return this.get('timestamp'); }
  get eventName() { return this.get('eventName'); }
  get userId() { return this.get('userId'); }
  get dimensions() { return this.get('dimensions'); }

}

export class ContentDefinition extends BaseObject {
  constructor(attributes) { super('ContentDefinition', attributes); }

  get enabled() { return this.get('enabled'); }
  set enabled(value) { this.setAttr('enabled', value); }

  get title() { return this.get('title'); }
  set title(value) { this.setAttr('title', value); }

  get mobileView() { return this.get('mobileView'); }
  set mobileView(value) { this.setAttr('mobileView', value); }

  get image() { return this.get('image'); }
  set image(value) { this.setAttr('image', value); }

  get description() { return this.get('description'); }
  set description(value) { this.setAttr('description', value); }

  get refs() { return this.get('refs'); }
  set refs(value) { this.setAttr('refs', value); }

  get enabledName() { return ContentDefinition.getEnabledName(this.enabled); }
  get mobileViewName() { return ContentDefinition.getMobileViewName(this.mobileView); }

  static getEnabledName = (value) => value ? 'Enabled' : 'Disabled';
  static mobileView = Object.freeze({ chess: 'chess', full: 'full', list: 'list' });

  static getMobileViewName = (mobileView) => getValue(mobileView, { [ContentDefinition.mobileView.chess]: 'Chess', [ContentDefinition.mobileView.full]: 'Full', [ContentDefinition.mobileView.list]: 'List' }, mobileView);
}

export class Document extends BaseObject {
  constructor(attributes) { super('Document', attributes); }

  get title() { return this.get('title'); }
  set title(value) { this.setAttr('title', value); }

  get description() { return this.get('description'); }
  set description(value) { this.setAttr('description', value); }

  get content() { return this.get('content'); }
  set content(value) { this.setAttr('content', value); }

  get contentResources() { return this.get('contentResources'); }
  set contentResources(value) { this.setAttr('contentResources', value); }

  get language() { return this.get('language'); }
  set language(value) { this.setAttr('language', value); }
}

export class Content extends BaseObject {
  constructor(attributes) { super('Content', attributes); }

  get definition() { return this.get('definition'); }
  set definition(value) { this.setAttr('definition', value); }

  get images() { return this.get('images'); }
  set images(value) { this.setAttr('images', value); }

  get visibility() { return this.get('visibility'); }
  set visibility(value) { this.setAttr('visibility', value); }
  get visibilityName() { return Content.getVisibilityName(this.visibility); }

  get contents() { return this.get('contents'); }
  set contents(value) { this.setAttr('contents', value); }

  get entityType() { return this.get('entityType'); }
  set entityType(value) { this.setAttr('entityType', value); }
  get entityTypeName() { return Content.getEntityTypeName(this.entityType); }

  get entityInfo() { return this.get('entityInfo'); }
  set entityInfo(value) { this.setAttr('entityInfo', value); }

  static entityType = Object.freeze({ event: 'event', content: 'content' });
  static getEntityTypeName = (entityType) => getValue(entityType, { [Content.entityType.event]: 'Event', [Content.entityType.content]: 'Content' }, entityType);

  static visibility = Object.freeze({ none: 'Admin', public: '*', members: 'Client' });
  static getVisibilityName = (visibility) => getValue(visibility, { [Content.visibility.none]: 'Hidden', [Content.visibility.public]: 'Public', [Content.visibility.members]: 'Members' }, visibility);
  static getVisibilityColor = (visibility) => getValue(visibility, { [Content.visibility.none]: 'grey', [Content.visibility.public]: 'blue', [Content.visibility.members]: 'green' }, 'grey');
}
