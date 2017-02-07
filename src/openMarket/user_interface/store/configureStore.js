// @flow
if (process.env.NODE_ENV === 'production') {
  module.exports = require('./configureStore.production.js'); // eslint-disable-line global-require
} else {
  module.exports = require('./configureStore.development.js'); // eslint-disable-line global-require
}
