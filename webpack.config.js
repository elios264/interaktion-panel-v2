require('env2')('./.env');

const _ = require('lodash');
const path = require('path');
const webpack = require('webpack');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const MomentLocalesPlugin = require('moment-locales-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const AssetsPlugin = require('assets-webpack-plugin');

const isDev = process.env.NODE_ENV !== 'production';
const ifDev = (then) => (isDev ? then : null);
const ifProd = (then) => (!isDev ? then : null);

module.exports = {
  target: 'web',
  profile: true,
  mode: isDev ? 'development' : 'production',
  entry: {
    admin: [ifDev('webpack-hot-middleware/client'), ifDev('react-hot-loader/patch'), './admin/appLoader'].filter(_.identity),
  },
  optimization: {
    runtimeChunk: isDev,
    minimizer: [
      new TerserPlugin({ extractComments: false, terserOptions: { toplevel: true, output: { comments: false } } }),
      new CssMinimizerPlugin(),
    ],
  },
  performance: { hints: false },
  context: path.resolve(__dirname, './src'),
  devtool: false,
  output: {
    publicPath: '/',
    path: path.resolve(__dirname, './dist'),
    filename: isDev ? '[name].bundle.js' : '[name].bundle.[contenthash].js',
  },
  resolve: {
    fallback: {
      'crypto': require.resolve('crypto-browserify'),
      'path': require.resolve('path-browserify'),
      'stream': require.resolve('stream-browserify'),
    },
    modules: [path.resolve(__dirname, './src'), path.resolve(__dirname, './assets'), 'node_modules'],
    alias: {
      '@': path.resolve(__dirname, './src'), // include your file like this in less files: ~@/yourFile.less
      '../../theme.config$': path.join(__dirname, './src/theme/semantic/theme.config.less'), // semantic requirement
      'react-dom': isDev ? '@hot-loader/react-dom' : 'react-dom',
    },
  },
  plugins: [
    new webpack.ProvidePlugin({ process: 'process/browser' }),
    ifDev(new webpack.SourceMapDevToolPlugin({ filename: '[file].map', exclude: /node_modules/ })),
    ifProd(new CleanWebpackPlugin({ cleanOnceBeforeBuildPatterns: ['**/*', path.join(process.cwd(), 'logs/**/*')], verbose: true })),
    ifProd(new webpack.LoaderOptionsPlugin({ minimize: true, debug: false })),
    new MomentLocalesPlugin(),
    ifDev(new webpack.HotModuleReplacementPlugin()),
    new AssetsPlugin({
      filename: 'rendering-manifest.json',
      entrypoints: true,
      processOutput: (assets) => JSON.stringify(_.mapValues(assets, (assetsByType) => _.mapValues(assetsByType, _.castArray)), null, 2),
    }),
    new MiniCssExtractPlugin({ filename: isDev ? '[name].css' : '[name].bundle.[contenthash].css' }),
    ifProd(new CopyWebpackPlugin({ patterns: [{ from: path.resolve(__dirname, './assets/static') }] })),
  ].filter(_.identity),
  module: {
    rules: [{
      test: /\.js$/,
      include: [path.resolve(__dirname, './src')],
      use: 'babel-loader',
    }, {
      test: /\.(css|less)$/,
      use: [
        { loader: MiniCssExtractPlugin.loader, options: { hmr: isDev } },
        { loader: 'css-loader', options: { importLoaders: 1, sourceMap: isDev } },
        { loader: 'less-loader', options: { sourceMap: isDev } },
      ],
    }, {
      test: /\.jpe?g$|\.gif$|\.png$|\.ico$|\.ttf$|\.eot$|\.svg$|\.woff(2)?(\?v=[0-9]\.[0-9]\.[0-9])?$/,
      use: [{ loader: 'file-loader', options: { esModule: false, name: isDev ? '[name].[ext]' : '[name].[contentHash].[ext]' } }],
    }],
  },
};
