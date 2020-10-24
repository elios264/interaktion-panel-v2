module.exports = {
  presets: [
    ['@babel/preset-react', { runtime: 'automatic' }],
    ['@babel/preset-env', {
      loose: true,
      useBuiltIns: 'usage',
      corejs: { version: 3, proposals: true },
      modules: false,
      targets: { browsers: process.env.NODE_ENV === 'production' ? '> 1%' : 'chrome 86' },
    }],
  ],
  plugins: [
    ['@babel/plugin-proposal-class-properties', { loose: true }],
    'react-hot-loader/babel',
  ],
};
