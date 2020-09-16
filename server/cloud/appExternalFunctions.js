/* global Parse */
const _ = require('lodash');
const types = require('./types');
const cloud = require('./cloudUtils');

const getResourceData = (resource) => ({
  url: _.result(resource, 'attributes.src.url'),
  thumb: _.result(resource, 'attributes.thumbnail.url'),
  name: _.replace(_.result(resource, 'attributes.src.name'), /^[a-zA-Z0-9]*_/, ''),
  size: _.get(resource, 'attributes.metadata.size'),
  desc: _.get(resource, 'attributes.desc'),
});

const getContentDocument = ({ content, contentsResources }) => _.map(content[0].children, (node) => {
  switch (node.type) {
    case 'img': return { ...node, image: getResourceData(contentsResources[node.image]) };
    case 'attachment': return { ...node, attachment: getResourceData(contentsResources[node.attachment]) };
    default: return node;
  }
});


cloud.setupFunction('get-client-data', async (req) => {
  const defaultLanguage = process.env.APP_LOCALE;
  const { language = defaultLanguage } = req.params;

  const clientFeatures = await new Parse.Query('Config')
    .equalTo('name', 'client-features')
    .first(cloud.masterPermissions)
    .then((setting) => setting ? JSON.parse(setting.get('value')) : setting);
  const authMode = clientFeatures.authMode || types.authMode.private;

  if (authMode === types.authMode.private) {
    cloud.ensureIsUser(req);
  }

  const [contentDefinitionsData, contentsData] = await Promise.all([
    new Parse.Query('ContentDefinition')
      .equalTo('enabled', true)
      .include('image')
      .find(cloud.getUserPermissions(req)),
    new Parse.Query('Content')
      .matchesQuery('definition', new Parse.Query('ContentDefinition').equalTo('enabled', true))
      .containedIn('visibility', [types.visibility.members, types.visibility.public])
      .include(['image', 'contentsResources'])
      .find(cloud.getUserPermissions(req)),
  ]);

  const sections = _(contentDefinitionsData)
    .map(({ id, attributes }) => ({ id, ...attributes }))
    .map(({ id, title, mobileView, image, description, order }) => ({
      id,
      mobileView,
      order,
      title: title[language] || title[defaultLanguage],
      description: description[language] || description[defaultLanguage],
      image: getResourceData(image),
    }))
    .value();

  const contents = _(contentsData)
    .map(({ id, createdAt, attributes }) => ({ id, createdAt, ...attributes }))
    .map(({ id, createdAt, definition, image, contents, title, description, contentsResources, entityType, entityInfo }) => ({
      id,
      createdAt,
      definition: definition.id,
      title: title[language] || title[defaultLanguage],
      description: description[language] || description[defaultLanguage],
      entityType,
      entityInfo,
      image: getResourceData(image),
      document: getContentDocument({ contentsResources, content: contents[language] || contents[defaultLanguage] }),
    }))
    .value();


  return {
    features: { authMode },
    sections,
    contents,
  };
});
