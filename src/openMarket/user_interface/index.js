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
import {record} from '../infrastructure/logging/ErrorLog';
import Theme from '../domain/appearance/Theme';
import './file.scss';

/**
 * SQLite answers synchronously, so the theme is on `<html>` before React paints.
 * @returns {string}
 */
function savedThemeId() {
  let themeId = Theme.DEFAULT.id;
  try {
    OpenMarket.get('appearance_get_use_case').get().subscribe(
      preferences => {
        themeId = preferences.theme.id;
      },
      error => {
        record(error);
        themeId = Theme.DEFAULT.id;
      }
    );
  } catch (error) {
    record(error);
    themeId = Theme.DEFAULT.id;
  }
  return themeId;
}

const themeId = savedThemeId();
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
