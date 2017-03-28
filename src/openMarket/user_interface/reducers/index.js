// @flow
import { combineReducers } from 'redux';
import { combineEpics } from 'redux-observable';
import { routerReducer as routing } from 'react-router-redux';
import { reducer as formReducer } from 'redux-form'
import counter from './counter';
import product from './product';
import {fetchCategoriesEpic} from '../epics/category';

export const rootEpic = combineEpics(
  fetchCategoriesEpic
);

export const rootReducer = combineReducers({
  counter,
  product,
  form: formReducer,
  routing
});


