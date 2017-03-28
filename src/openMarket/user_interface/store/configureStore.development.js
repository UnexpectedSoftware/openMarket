import { createStore, applyMiddleware, compose } from 'redux';
import { createEpicMiddleware } from 'redux-observable';
import thunk from 'redux-thunk';
import { hashHistory } from 'react-router';
import { routerMiddleware, push } from 'react-router-redux';
import createLogger from 'redux-logger';
import {rootReducer,rootEpic} from '../reducers';

import * as counterActions from '../actions/counter';
import * as productActions from '../actions/product';
import type { counterStateType } from '../reducers/counter';

const actionCreators = {
  ...counterActions,
  ...productActions,
  push,
};

const logger = createLogger({
  level: 'info',
  collapsed: true
});

const router = routerMiddleware(hashHistory);
const epicMiddleware = createEpicMiddleware(rootEpic);
// If Redux DevTools Extension is installed use it, otherwise use Redux compose
/* eslint-disable no-underscore-dangle */
const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ ?
  window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__({
    // Options: http://zalmoxisus.github.io/redux-devtools-extension/API/Arguments.html
    actionCreators,
  }) :
  compose;
/* eslint-enable no-underscore-dangle */
const enhancer = composeEnhancers(
  applyMiddleware(thunk, router, logger, epicMiddleware)
);



export default function configureStore(initialState?: counterStateType) {
  const store = createStore(
    rootReducer,
    initialState,
    enhancer,
    applyMiddleware(epicMiddleware)
  );

  if (module.hot) {
    module.hot.accept('../reducers', () =>
      store.replaceReducer(require('../reducers/index')) // eslint-disable-line global-require
    );
  }

  return store;
}
