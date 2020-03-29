/* eslint brace-style: ["error", "1tbs", { "allowSingleLine": true }]*/

import _ from 'lodash';
import Parse from 'parse';

const isEmpty = (val) => (_.isPlainObject(val) ? _.isEmpty(val) : _.isNil(val) || val === '');
// const getValue = (value, mapping = {}, defaultValue) => _.get(mapping, `[${value}]`, defaultValue);
const copy = (object) => {
  const jsonObj = object.toJSON();
  jsonObj.className = object.className;
  const newObj = Parse.Object.fromJSON(jsonObj);
  return object.id ? newObj : newObj.clone();
};

class BaseObject extends Parse.Object {
  setAttr(prop, value) { return isEmpty(value) ? super.unset(prop) : super.set(prop, value); }
  copy() { return copy(this); }
}

export const fromJSON = (className, json) => BaseObject.fromJSON({ ...json, className });

export class File extends Parse.File {
  static getFileName = _.flow(_.partialRight(_.replace, /\.[^/.]+$/, ''), _.camelCase)

  constructor(file, blob, type) {
    if (blob) {
      super(File.getFileName(file), blob, type);
      this.localName = file;
      this.localSize = blob.base64.length * 0.75;
    } else {
      super(File.getFileName(file.name), file);
      this.localName = file.name;
      this.localSize = file.size;
    }
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

  get lastActivity() { return this.get('lastActivity'); }
  get sessionToken() { return this.getSessionToken(); }

  copy() { return copy(this); }

  static withSessionToken = (user, token) => {
    const { className } = user;
    user = user.toJSON();
    user.className = className;
    user.sessionToken = token;
    return Parse.Object.fromJSON(user);
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
  get fileExtension() { return _.split(this.fileName, '.')[1]; }
  get fileSize() { return _.get(this.src, 'localSize', _.get(this.metadata, 'size')); }
  get thumb() { return _.result(this.thumbnail, 'url', this.fileUrl); }
}

export class EventLog extends BaseObject {
  constructor(attributes) { super('EventLog', attributes); }

  get timestamp() { return this.get('timestamp'); }
  get eventName() { return this.get('eventName'); }
  get userId() { return this.get('userId'); }
  get dimensions() { return this.get('dimensions'); }

}
