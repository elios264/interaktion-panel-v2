/* global Parse */
const sharp = require('sharp');
const crypto = require('crypto');
const cloud = require('../cloudUtils');

const isImage = (url) => (url.match(/\.(jpeg|jpg|gif|png)$/) !== null);

const generateResourceDerivedData = async (resourceUrl, thumbnail) => {

  const response = await Parse.Cloud.httpRequest({ url: resourceUrl });
  const { 'content-length': size } = response.headers;

  const hash = response.headers['content-md5'] || crypto.createHash('md5').update(response.buffer).digest('base64');

  if (!isImage(resourceUrl)) {
    return { size, hash };
  }

  const image = sharp(response.buffer);
  const { height, width, format } = await image.metadata();

  let buffer;
  if (thumbnail && width > 300) {
    buffer = await image.resize(300).toBuffer();
  }

  return {
    thumbnail: buffer ? buffer.toString('base64') : undefined,
    height,
    width,
    format,
    size,
    hash,
  };
};

const extractData = (source, { thumbnail: thumbnailColumn, metadata }) => async (req) => {
  const { object } = req;

  if (!object.get(source) || !object.dirty(source)) {
    return;
  }

  const resource = object.get(source).url();

  const { format, thumbnail, ...metadataObject } = await generateResourceDerivedData(resource, !!thumbnailColumn);

  if (thumbnail) {
    const file = await new Parse.File(`thumb.${format}`, { base64: thumbnail }, `image/${format}`).save(cloud.masterPermissions);
    object.set(thumbnailColumn, file);
  }

  if (metadata) {
    object.set('metadata', metadataObject);
  }
};

module.exports = {
  extractData,
};
