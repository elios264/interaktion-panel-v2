require('env2')('./.env');

const _ = require('lodash');
const path = require('path');
const webpack = require('webpack');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const CircularDependencyPlugin = require('circular-dependency-plugin');
const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const MomentLocalesPlugin = require('moment-locales-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
const ChunksAssetsPlugin = require('./server/tools/chunksAssetsPlugin');

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
      new OptimizeCSSAssetsPlugin({ cssProcessorPluginOptions: { preset: ['default', { discardComments: { removeAll: true } }] } }),
    ],
    splitChunks: {
      minSize: 0,
      chunks: 'all',
    },
  },
  performance: { hints: false },
  context: path.resolve(__dirname, './src'),
  devtool: false,
  output: { publicPath: '/', path: path.resolve(__dirname, './dist'), filename: isDev ? '[name].bundle.js' : '[name].bundle.[contenthash].js' },
  resolve: {
    modules: [path.resolve(__dirname, './src'), path.resolve(__dirname, './assets'), 'node_modules'],
    alias: {
      '@': path.resolve(__dirname, './src'), // include your file like this in less files: ~@/yourFile.less
      '../../theme.config$': path.join(__dirname, './src/theme/semantic/theme.config.less'), // semantic requirement
      'react-dom': isDev ? '@hot-loader/react-dom' : 'react-dom',
      '@hapi/joi$': '@hapi/joi/lib/index.js',
    },
  },
  node: { // allow Joi package to be bundled on browser since it is originally made for node.js
    crypto: 'empty',
    net: 'empty',
    dns: 'empty',
  },
  plugins: [
    ifDev(new webpack.SourceMapDevToolPlugin({ filename: '[file].map', exclude: /node_modules/ })),
    ifProd(new CleanWebpackPlugin({ cleanOnceBeforeBuildPatterns: ['**/*', path.join(process.cwd(), 'logs/**/*')], verbose: true })),
    ifProd(new webpack.LoaderOptionsPlugin({ minimize: true, debug: false })),
    new MomentLocalesPlugin(),
    new CircularDependencyPlugin({ exclude: /node_modules/, failOnError: true, cwd: path.resolve(__dirname, './src') }),
    ifDev(new webpack.HotModuleReplacementPlugin()),
    new ChunksAssetsPlugin({ fileName: 'rendering-manifest.json' }),
    new MiniCssExtractPlugin({ filename: isDev ? '[name].css' : '[name].bundle.[contenthash].css' }),
    ifProd(new CopyWebpackPlugin([{ from: path.resolve(__dirname, './assets/static') }])),
    ifProd(new BundleAnalyzerPlugin({ analyzerMode: 'static', reportFilename: 'bundles-report.html', openAnalyzer: false })),
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
        { loader: 'css-loader', options: { importLoaders: 2, sourceMap: isDev } },
        { loader: 'postcss-loader', options: { ident: 'postcss', sourceMap: isDev,
          plugins: () => [require('postcss-custom-media')()] } },
        { loader: 'less-loader', options: { noIeCompat: true, sourceMap: isDev } },
      ],
    }, {
      test: /\.jpe?g$|\.gif$|\.png$|\.ico$|\.ttf$|\.eot$|\.svg$|\.woff(2)?(\?v=[0-9]\.[0-9]\.[0-9])?$/,
      use: [{ loader: 'file-loader', options: { esModule: false, name: isDev ? '[name].[ext]' : '[name].[hash].[ext]' } }],
    }],
  },
};
