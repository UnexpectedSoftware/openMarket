// @flow
import { combineReducers } from 'redux';

import { routerReducer as routing } from 'react-router-redux';
import { reducer as formReducer } from 'redux-form'
import counter from './counter';
import newProductReducer from '../product/new_product/reducer';
import listProductReducer from '../product/list_products/reducer';
import newOrderReducer from '../order/new_order/reducer';


export const rootReducer = combineReducers({
  counter,
  newProduct: newProductReducer,
  listProduct: listProductReducer,
  newOrder: newOrderReducer,
  form: formReducer,
  routing
});


