// @flow
import { combineReducers } from 'redux';

import { routerReducer as routing } from 'react-router-redux';
import { reducer as formReducer } from 'redux-form'
import counter from './counter';
import product from './product';



export const rootReducer = combineReducers({
  counter,
  product,
  form: formReducer,
  routing
});


