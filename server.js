require('env2')('./.env');

const fs = require('fs');
const cors = require('cors');
const path = require('path');
const express = require('express');
const compression = require('compression');
const { parseMiddleware, htmlForCSR } = require('./server/tools');

const isDev = process.env.NODE_ENV !== 'production';
const infoEnvironment = {
  APP_NAME: process.env.APP_NAME,
  BUILD: process.env.BUILD || '0',
  BUILD_ENVIRONMENT: process.env.BUILD_ENVIRONMENT || process.env.NODE_ENV,
};
const adminEnvironment = {
  ...infoEnvironment,
  APP_URL: process.env.APP_URL,
  APP_ADMIN_PATH: process.env.APP_ADMIN_PATH,
  PARSE_PATH: process.env.PARSE_PATH,
  PARSE_APPID: process.env.PARSE_APPID,
  APP_LOGO_URL: process.env.APP_LOGO_URL,
  APP_FAVICON_URL: process.env.APP_FAVICON_URL,
  APP_CURRENCY: process.env.APP_CURRENCY,
  APP_LOCALE: process.env.APP_LOCALE,
};

console.log(`Starting server with NODE_ENV is ${process.env.NODE_ENV}, isDev is ${isDev}`);
const app = express();
app.use(cors());
app.use(compression());
app.use(express.json());
const { parseDashboard, parseServer } = parseMiddleware({ isDev });
app.use(process.env.PARSE_PATH, parseServer);
app.use('/dashboard', parseDashboard);
app.get('/info', (req, res) => res.json(infoEnvironment));
app.get('/', (req, res) => res.redirect(process.env.APP_ADMIN_PATH));

if (isDev) {
  const webpack = require('webpack');
  const webpackDevMiddleware = require('webpack-dev-middleware');
  const webpackHotMiddleware = require('webpack-hot-middleware');

  const webpackConfig = require('./webpack.config');
  const compiler = webpack(webpackConfig);
  const middleware = webpackDevMiddleware(compiler, { publicPath: webpackConfig.output.publicPath, stats: { colors: true, chunks: false } });
  const hotMiddleware = webpackHotMiddleware(compiler);

  app.use(middleware);
  app.use(hotMiddleware);
  app.get(new RegExp(process.env.APP_ADMIN_PATH), (req, res) => {
    const { admin: { js, css } } = JSON.parse(fs.readFileSync('./rendering-manifest.json', 'utf8'));
    const html = htmlForCSR({ js, css, environment: adminEnvironment });
    res.send(html);
  });
} else {
  const { admin } = JSON.parse(fs.readFileSync('./rendering-manifest.json', 'utf8'));

  app.use(express.static(path.resolve(__dirname, './dist'), { maxAge: 31536000 }));
  app.get(new RegExp(process.env.APP_ADMIN_PATH), (req, res) => {
    const html = htmlForCSR({ js: admin.js, css: admin.css, environment: adminEnvironment });
    res.send(html);
  });
}

const httpServer = require('http').createServer(app);
httpServer.listen(parseInt(process.env.APP_PORT));
parseServer.createLiveQueryServer(httpServer);

console.log(`Server started! on ${process.env.APP_URL} and port ${process.env.APP_PORT}`);
