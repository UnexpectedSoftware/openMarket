import '../infrastructure/logging/installRendererErrorLog';
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/inter/700.css';
import '@fontsource/jetbrains-mono/400.css';
import '@fontsource/jetbrains-mono/700.css';
import React from 'react';
import { render } from 'react-dom';
import { Provider } from 'react-redux';
import { Router, hashHistory } from 'react-router';
import { syncHistoryWithStore } from 'react-router-redux';
import routes from './routes';
import configureStore from './store/configureStore';
import OpenMarket from '../application/index';
import savedThemeId from './appearance/savedThemeId';
import './file.scss';

const themeId = savedThemeId(OpenMarket.get('appearance_get_use_case'));
document.documentElement.dataset.theme = themeId;

const store = configureStore({
  appearance: {theme: themeId, applied: themeId}
});
const history = syncHistoryWithStore(hashHistory, store);

render(
  <Provider store={store}>
    <Router history={history} routes={routes} />
  </Provider>,
  document.getElementById('root')
);
