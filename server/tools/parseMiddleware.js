const ParseDashboard = require('parse-dashboard');
const { ParseServer } = require('parse-server');
const { AnalyticsAdapter, EmailAdapter } = require('../cloud/adapters');
// const { AzureStorageAdapter } = require('./azureStorageAdapter');

const parseDefaults = require('parse-server/lib/defaults');
parseDefaults.default.protectedFields = { }; // {"_User":{"*":["email"]}}, removing default

module.exports = ({ isDev }) => {

  const parseServer = new ParseServer({
    appName: process.env.APP_NAME,
    appId: process.env.PARSE_APPID,
    masterKey: process.env.PARSE_MASTER_KEY,
    databaseURI: process.env.PARSE_STORAGE,
    enableAnonymousUsers: false,
    directAccess: true,
    allowClientClassCreation: false,
    revokeSessionOnPasswordReset: true,
    mountPath: process.env.PARSE_PATH,
    schemaCacheTTL: isDev ? 5000 : 1000 * 60 * 60,
    enableSingleSchemaCache: !isDev,
    port: parseInt(process.env.APP_PORT),
    publicServerURL: `${process.env.APP_URL}${process.env.PARSE_PATH}`,
    cloud: './server/cloud',
    serverURL: `http://localhost:${process.env.APP_PORT}${process.env.PARSE_PATH}`,
    liveQuery: { classNames: ['_User', 'Config', 'Resource', 'EventLog', 'ContentDefinition', 'Content'] },
    passwordPolicy: { validatorPattern: /^(?=.*[a-z])(?=.*[0-9])(?=.{8,})/ },
    analyticsAdapter: new AnalyticsAdapter(),
    emailAdapter: {
      module: EmailAdapter,
      options: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
        sender: process.env.EMAIL_SENDER,
        host: process.env.EMAIL_HOST,
        port: parseInt(process.env.EMAIL_PORT),
      },
    },
    customPages: {
      choosePassword: `${process.env.APP_URL}${process.env.APP_ADMIN_PATH}/reset-password`,
      invalidLink: `${process.env.APP_URL}${process.env.APP_ADMIN_PATH}/invalid-link`,
      passwordResetSuccess: `${process.env.APP_URL}${process.env.APP_ADMIN_PATH}/reset-success`,
    },
    // filesAdapter: new AzureStorageAdapter(process.env.PARSE_BLOB_STORAGE, process.env.PARSE_BLOB_STORAGE_CONTAINER),
  });

  const parseDashboard = new ParseDashboard({
    apps: [{
      appName: process.env.APP_NAME,
      production: !isDev,
      appId: process.env.PARSE_APPID,
      masterKey: process.env.PARSE_MASTER_KEY,
      serverURL: `${process.env.APP_URL}${process.env.PARSE_PATH}`,
    }],
    users: [{ user: 'root', pass: process.env.PARSE_DASHBOARD_PASS }],
    useEncryptedPasswords: true,
    trustProxy: isDev ? 0 : 1,
  }, { allowInsecureHTTP: isDev });

  parseServer.createLiveQueryServer = ParseServer.createLiveQueryServer;

  return { parseDashboard, parseServer };
};
