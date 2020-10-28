/* global Parse */
const _ = require('lodash');
const types = require('./types');
const cloud = require('./cloudUtils');

const getResourceData = (resource) => ({
  uri: _.result(resource, 'attributes.src.url'),
  thumb: _.result(resource, 'attributes.thumbnail.url'),
  name: _.replace(_.result(resource, 'attributes.src.name'), /^[a-zA-Z0-9]*_/, ''),
  size: _.get(resource, 'attributes.metadata.size'),
  desc: _.get(resource, 'attributes.desc'),
  width: _.get(resource, 'attributes.metadata.width'),
  height: _.get(resource, 'attributes.metadata.height'),
  cache: 'force-cache',
});

const getContentDocument = (node, nodeResources) => {

  switch (node.type) {
    case 'img':
    case 'attachment':
      return { ...node, resource: getResourceData(nodeResources[node.resource]) };
    default:
      return node.children
        ? { ...node, children: _.map(node.children, (child) => getContentDocument(child, nodeResources)) }
        : node;
  }
};

cloud.setupFunction('get-client-data', async (req) => {
  const defaultLanguage = process.env.APP_LOCALE;
  const { language = defaultLanguage } = req.params;

  const { clientFeatures, privacyPolicyUrl } = await new Parse.Query('Config')
    .containedIn('name', ['client-features', 'privacy-policy-url'])
    .find(cloud.masterPermissions)
    .then((config) => _(config)
      .keyBy((setting) => _.camelCase(setting.get('name')))
      .mapValues((setting) => (setting ? JSON.parse(setting.get('value')) : {}))
      .value());

  const config = {
    features: {
      ...clientFeatures,
      authMode: clientFeatures.authMode || types.authMode.private,
    },
    privacyPolicyUrl: privacyPolicyUrl[language] || privacyPolicyUrl[defaultLanguage],
  };

  if (config.features.authMode === types.authMode.private && !req.user) {
    return { config };
  }

  const [contentDefinitionsData, contentsData, pagesData] = await Promise.all([
    new Parse.Query('ContentDefinition')
      .equalTo('enabled', true)
      .include('image')
      .find(cloud.getUserPermissions(req)),
    new Parse.Query('Content')
      .matchesQuery('definition', new Parse.Query('ContentDefinition').equalTo('enabled', true))
      .containedIn('visibility', [types.visibility.members, types.visibility.public])
      .include(['image', 'documentResources'])
      .find(cloud.getUserPermissions(req)),
    new Parse.Query('Page')
      .containedIn('visibility', [types.visibility.members, types.visibility.public])
      .include(['documentResources'])
      .find(cloud.getUserPermissions(req)),
  ]);

  const pages = _(pagesData)
    .map(({ id, attributes }) => ({ id, ...attributes }))
    .map(({
      id, createdAt, updatedAt, document, title, description, documentResources, order,
    }) => ({
      id,
      createdAt,
      updatedAt,
      title: title[language] || title[defaultLanguage],
      description: description[language] || description[defaultLanguage],
      order,
      document: getContentDocument(_.get(document[language] || document[defaultLanguage], '[0]', { children: [] }), _.keyBy(documentResources, 'id')),
    }))
    .value();

  const contents = _(contentsData)
    .map(({ id, attributes }) => ({ id, ...attributes }))
    .map(({
      id, createdAt, updatedAt, definition, image, document, title, description, documentResources, entityType, entityInfo, order,
    }) => ({
      id,
      createdAt,
      updatedAt,
      section: definition.id,
      title: title[language] || title[defaultLanguage],
      description: description[language] || description[defaultLanguage],
      entityType,
      entityInfo,
      order,
      image: getResourceData(image),
      document: getContentDocument(_.get(document[language] || document[defaultLanguage], '[0]', { children: [] }), _.keyBy(documentResources, 'id')),
    }))
    .value();

  const sectionHasContents = _(contents)
    .groupBy('section')
    .mapValues('length')
    .value();

  const sections = _(contentDefinitionsData)
    .map(({ id, attributes }) => ({ id, ...attributes }))
    .filter(({ id }) => sectionHasContents[id])
    .map(({
      id, title, mobileView, image, description, order,
    }) => ({
      id,
      mobileView,
      order,
      title: title[language] || title[defaultLanguage],
      description: description[language] || description[defaultLanguage],
      image: getResourceData(image),
    }))
    .value();

  return {
    config,
    sections,
    contents,
    pages,
  };
});
