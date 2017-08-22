// @flow
import { combineReducers } from 'redux';

import { routerReducer as routing } from 'react-router-redux';
import { reducer as formReducer } from 'redux-form'
import counter from './counter';
import newProductReducer from '../product/new_product/reducer';
import listProductLowStockReducer from '../product/list_products_low_stock/reducer';
import listOrderReducer from '../order/list_orders/reducer';
import newOrderReducer from '../order/new_order/reducer';
import dialogReducer from '../dialog/reducer';


export const rootReducer = combineReducers({
  counter,
  newProduct: newProductReducer,
  listProductLowStock: listProductLowStockReducer,
  newOrder: newOrderReducer,
  listOrder: listOrderReducer,
  dialog: dialogReducer,
  form: formReducer,
  routing
});


