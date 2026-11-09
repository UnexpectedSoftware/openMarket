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
import newProductDialogReducer from '../order/new_product_dialog/reducer';
import homeReducer from '../home/reducer';
import imageFetchReducer from '../image/reducer';
import catalogPrintReducer from '../product/list_products/printReducer';
import pluginsReducer from '../plugin/reducer';
import settingsReducer from '../settings/reducer';
import appearanceReducer from '../appearance/reducer';
import notifications from './notifications';
import lowStockReducer from '../low_stock/reducer';
import reportReducer from '../report/reducer';


export const rootReducer = combineReducers({
  newProduct: newProductReducer,
  categoriesPage: categoriesReducer,
  listProducts:listProductsReducer,
  newOrder: newOrderReducer,
  listOrder: listOrderReducer,
  dialog: dialogReducer,
  weightedDialog: weightedDialogReducer,
  newProductDialog: newProductDialogReducer,
  statistics: homeReducer,
  imageFetch: imageFetchReducer,
  catalogPrint: catalogPrintReducer,
  pluginsPage: pluginsReducer,
  settings: settingsReducer,
  appearance: appearanceReducer,
  lowStock: lowStockReducer,
  report: reportReducer,
  notifications,
  form: formReducer,
  routing
});


