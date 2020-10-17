/* global Parse */
const _ = require('lodash');
const { Expo } = require('expo-server-sdk');

const types = require('./types');
const cloud = require('./cloudUtils');

const notificationsClient = new Expo();
const DeviceInstallation = Parse.Object.extend('DeviceInstallation');
const allowedProperties = ['deviceName', 'deviceYear', 'deviceVersion', 'devicePlatform', 'appVersion', 'buildVersion', 'language', 'enabled', 'pushToken'];

cloud.setupFunction('set-installation', async (req) => {
  const { user, params } = req;
  const { installationId, ...properties } = params;

  const installation = await new Parse.Query(DeviceInstallation)
    .equalTo('installationId', installationId)
    .first(cloud.masterPermissions)
    .then((installation) => installation || new DeviceInstallation({ installationId }));

  _.each(_.pick(properties, allowedProperties), (value, key) => {
    if (value === null) {
      installation.unset(key);
    } else {
      installation.set(key, value);
    }
  });

  if (user) {
    installation.set('user', user);
  } else {
    installation.unset('user');
  }

  await installation.save(null, cloud.masterPermissions);

  return true;
});

cloud.setupFunction('send-content-notification', async (req) => {
  cloud.ensureIsAdmin(req);

  const { contentId } = req.params;

  const [authMode, content] = await Promise.all([
    new Parse.Query('Config')
      .equalTo('name', 'client-features')
      .first(cloud.masterPermissions)
      .then((setting) => setting ? JSON.parse(setting.get('value')) : {})
      .then(({ authMode }) => authMode || types.authMode.private),
    new Parse.Query('Content')
      .equalTo('objectId', contentId)
      .select('visibility', 'title', 'description')
      .first(cloud.masterPermissions)
      .then((content) => !content ? undefined : ({ id: content.id, ...content.attributes })),
  ]);

  if (!content) {
    throw new Parse.Error(Parse.Error.OBJECT_NOT_FOUND, `content with id ${contentId} was not found`);
  }

  if (content.visibility === types.visibility.none) {
    return false;
  }

  const notificationsQuery = new Parse.Query(DeviceInstallation).equalTo('enabled', true);

  if (authMode === types.authMode.private || content.visibility === types.visibility.members) {
    notificationsQuery.exists('user');
  }

  const installations = await notificationsQuery
    .select('pushToken', 'language')
    .find(cloud.masterPermissions)
    .then((results) => _.map(results, (installation) => ({
      installation,
      language: installation.get('language'),
      token: installation.get('pushToken'),
    })));

  const defaultLanguage = process.env.APP_LOCALE;
  const notificationData = { action: 'view_content', contentId };
  const messages = _.map(installations, ({ language, token }) => ({
    to: token,
    data: notificationData,
    title: content.title[language] || content.title[defaultLanguage],
    body: content.description[language] || content.description[defaultLanguage],
  }));

  const tickets = await Promise.all(
    _(messages)
      .chunk(100)
      .map((batch) => notificationsClient.sendPushNotificationsAsync(batch))
      .value()
  ).then(_.flatten);

  const faultyInstallations = _(tickets)
    .map((ticket, i) => {

      if (ticket.status === 'ok') {
        return undefined;
      }

      return ticket.details.error === 'DeviceNotRegistered'
        ? installations[i].installation
        : req.log.error(ticket);
    })
    .compact()
    .value();

  await Parse.Object.destroyAll(faultyInstallations, cloud.masterPermissions);
  return true;
});
