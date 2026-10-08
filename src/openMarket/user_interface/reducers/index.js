// @flow
import { combineReducers } from 'redux';

import { routerReducer as routing } from 'react-router-redux';
import { reducer as formReducer } from 'redux-form'
import newProductReducer from '../product/new_product/reducer';
import categoriesReducer from '../category/reducer';
import listProductsReducer from '../product/list_products/reducer';
import listOrderReducer from '../order/list_orders/reducer';
import newOrderReducer from '../order/new_order/reducer';
import dialogReducer from '../dialog/reducer';
import weightedDialogReducer from '../order/weighted_dialog/reducer';
import printerDialogReducer from '../order/printer_dialog/reducer';
import newProductDialogReducer from '../order/new_product_dialog/reducer';
import homeReducer from '../home/reducer';
import imageFetchReducer from '../image/reducer';
import catalogPrintReducer from '../product/list_products/printReducer';
import {reducer as notifications} from 'react-notification-system-redux';


export const rootReducer = combineReducers({
  newProduct: newProductReducer,
  categoriesPage: categoriesReducer,
  listProducts:listProductsReducer,
  newOrder: newOrderReducer,
  listOrder: listOrderReducer,
  dialog: dialogReducer,
  weightedDialog: weightedDialogReducer,
  printerDialog: printerDialogReducer,
  newProductDialog: newProductDialogReducer,
  statistics: homeReducer,
  imageFetch: imageFetchReducer,
  catalogPrint: catalogPrintReducer,
  notifications,
  form: formReducer,
  routing
});


