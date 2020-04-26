module.exports = {
  presets: [
    '@babel/preset-react',
    ['@babel/preset-env', { loose: true, useBuiltIns: 'usage', corejs: { version: 3, proposals: true }, modules: false, debug: process.env.NODE_ENV === 'production', targets: { browsers: process.env.NODE_ENV === 'production' ? '> 1%' : 'chrome 81' } }],
  ],
  plugins: [
    ['@babel/plugin-proposal-class-properties', { loose: true }],
    'react-hot-loader/babel',
  ],
};
