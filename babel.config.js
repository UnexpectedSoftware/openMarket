module.exports = {
  sourceType: 'unambiguous',
  presets: [
    ['@babel/preset-env', { targets: { node: '24' } }],
    ['@babel/preset-react', { runtime: 'classic' }]
  ],
  plugins: [
    'add-module-exports'
  ]
};
