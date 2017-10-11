// @flow
import { combineReducers } from 'redux';

import { routerReducer as routing } from 'react-router-redux';
import { reducer as formReducer } from 'redux-form'
import newProductReducer from '../product/new_product/reducer';
import listProductLowStockReducer from '../product/list_products_low_stock/reducer';
import listOrderReducer from '../order/list_orders/reducer';
import newOrderReducer from '../order/new_order/reducer';
import dialogReducer from '../dialog/reducer';
import weightedDialogReducer from '../order/weighted_dialog/reducer';
import printerDialogReducer from '../order/printer_dialog/reducer';
import homeReducer from '../home/reducer';
import {reducer as notifications} from 'react-notification-system-redux';


export const rootReducer = combineReducers({
  newProduct: newProductReducer,
  listProductLowStock: listProductLowStockReducer,
  newOrder: newOrderReducer,
  listOrder: listOrderReducer,
  dialog: dialogReducer,
  weightedDialog: weightedDialogReducer,
  printerDialog: printerDialogReducer,
  statistics: homeReducer,
  notifications,
  form: formReducer,
  routing
});


