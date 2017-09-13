// @flow
import { createStore, applyMiddleware } from 'redux';
import { createEpicMiddleware } from 'redux-observable';
import thunk from 'redux-thunk';
import { hashHistory } from 'react-router';
import { routerMiddleware } from 'react-router-redux';
import {rootReducer} from '../reducers';
import {rootEpic} from '../epics';

const epicMiddleware = createEpicMiddleware(rootEpic);

const router = routerMiddleware(hashHistory);

const enhancer = applyMiddleware(thunk, router);

export default function configureStore(initialState) {
  return createStore(
    rootReducer,
    initialState,
    enhancer,
    applyMiddleware(epicMiddleware)
  ); // eslint-disable-line
}
