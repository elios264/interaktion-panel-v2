/* global Parse */
const moment = require('moment');
const _ = require('lodash');
const { Expo } = require('expo-server-sdk');

const types = require('./types');
const cloud = require('./cloudUtils');

const notificationsClient = new Expo();
const DeviceInstallation = Parse.Object.extend('DeviceInstallation');
const allowedProperties = ['deviceName', 'deviceYear', 'deviceVersion', 'devicePlatform', 'appVersion', 'buildVersion', 'language', 'enabled', 'pushToken'];

const getInstallationsForVisibility = async (visibility) => {

  const authMode = await new Parse.Query('Config')
    .equalTo('name', 'client-features')
    .first(cloud.masterPermissions)
    .then((setting) => (setting ? JSON.parse(setting.get('value')) : {}))
    .then((config) => config.authMode || types.authMode.private);

  const notificationsQuery = new Parse.Query(DeviceInstallation).equalTo('enabled', true);

  if (authMode === types.authMode.private || visibility === types.visibility.members) {
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

  return installations;
};
const sendExpoNotifications = async (messages, onMessageFail = _.noop) => {

  const tickets = await Promise.all(
    _(messages)
      .map(({ installation, ...message }) => message)
      .chunk(100)
      .map((batch) => notificationsClient.sendPushNotificationsAsync(batch))
      .value(),
  ).then(_.flatten);

  const faultyInstallations = _(tickets)
    .map((ticket, i) => {

      if (ticket.status === 'ok') {
        return undefined;
      }

      return ticket.details.error === 'DeviceNotRegistered'
        ? messages[i].installation
        : (onMessageFail(ticket), undefined);
    })
    .compact()
    .value();

  await Parse.Object.destroyAll(faultyInstallations, cloud.masterPermissions);
  return true;
};

cloud.setupFunction('set-installation', async (req) => {
  const { user, params } = req;
  const { installationId, ...properties } = params;

  const installation = await new Parse.Query(DeviceInstallation)
    .equalTo('installationId', installationId)
    .first(cloud.masterPermissions)
    .then((deviceInstallation) => deviceInstallation || new DeviceInstallation({ installationId }));

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

  const content = await new Parse.Query('Content')
    .equalTo('objectId', contentId)
    .select('visibility', 'title', 'description')
    .first(cloud.masterPermissions)
    .then((con) => (!con ? undefined : ({
      id: con.id,
      updatedAt: con.updatedAt,
      ...con.attributes,
    })));

  if (!content) {
    throw new Parse.Error(Parse.Error.OBJECT_NOT_FOUND, `content with id ${contentId} was not found`);
  }

  if (content.visibility === types.visibility.none) {
    return false;
  }

  const installations = await getInstallationsForVisibility(content.visibility);

  const defaultLanguage = process.env.APP_LOCALE;
  const notificationData = {
    action: 'view_content',
    contentId,
    contentUpdatedAt: moment(content.updatedAt).toISOString(),
  };
  const messages = _.map(installations, ({ language, token, installation }) => ({
    to: token,
    data: notificationData,
    title: content.title[language] || content.title[defaultLanguage],
    body: content.description[language] || content.description[defaultLanguage],
    installation,
  }));

  await sendExpoNotifications(messages, (ticket) => req.log.error(ticket));

  return true;
});

cloud.setupFunction('send-page-notification', async (req) => {
  cloud.ensureIsAdmin(req);

  const { pageId } = req.params;

  const page = await new Parse.Query('Page')
    .equalTo('objectId', pageId)
    .select('visibility', 'title', 'description')
    .first(cloud.masterPermissions)
    .then((pag) => (!pag ? undefined : ({
      id: pag.id,
      updatedAt: pag.updatedAt,
      ...pag.attributes,
    })));

  if (!page) {
    throw new Parse.Error(Parse.Error.OBJECT_NOT_FOUND, `page with id ${pageId} was not found`);
  }

  if (page.visibility === types.visibility.none) {
    return false;
  }

  const installations = await getInstallationsForVisibility(page.visibility);

  const defaultLanguage = process.env.APP_LOCALE;
  const notificationData = {
    action: 'view_page',
    pageId,
    pageUpdatedAt: moment(page.updatedAt).toISOString(),
  };
  const messages = _.map(installations, ({ language, token, installation }) => ({
    to: token,
    data: notificationData,
    title: page.title[language] || page.title[defaultLanguage],
    body: page.description[language] || page.description[defaultLanguage],
    installation,
  }));

  await sendExpoNotifications(messages, (ticket) => req.log.error(ticket));

  return true;
});
