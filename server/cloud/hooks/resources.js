/* global Parse */
const sharp = require('sharp');
const _ = require('lodash');
const cloud = require('../cloudUtils');

const isImage = (url) => (url.match(/\.(jpeg|jpg|gif|png)$/) !== null);

const generateResourceDerivedData = async (resourceUrl, newWidth, thumbnail) => {

  const response = await Parse.Cloud.httpRequest({ url: resourceUrl });

  const { 'content-length': size, 'content-md5': hash } = response.headers;
  if (!isImage(resourceUrl)) {
    return { size, hash };
  }

  const image = sharp(response.buffer);
  let { height, width, format } = await image.metadata();

  let buffer;
  if (width > newWidth && thumbnail) {
    buffer = await image.resize(newWidth).toBuffer();
    height = (height * newWidth) / width;
    width = newWidth;
  }

  return {
    thumbnail: buffer ? buffer.toString('base64') : undefined,
    height, width, format, size, hash,
  };
};


const extractData = (source, { thumbnail: thumbnailColumn, metadata, resizeTo = 300 }) => async (req) => {
  const { object } = req;

  if (!object.get(source) || !object.dirty(source)) {
    return;
  }

  const resource = object.get(source).url();

  const { format, thumbnail, ...metadataObject } = await generateResourceDerivedData(resource, resizeTo, !!thumbnailColumn);

  if (thumbnail) {
    const file = await new Parse.File(`thumb.${format}`, { base64: thumbnail }, `image/${format}`).save(cloud.masterPermissions);
    object.set(thumbnailColumn, file);
  }

  if (metadata) {
    object.set('metadata', _.pick(metadataObject, metadata));
  }
};

module.exports = {
  extractData,
};
