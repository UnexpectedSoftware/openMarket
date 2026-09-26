import { combineEpics } from 'redux-observable';
import newProductEpic from '../product/new_product/epic';
import categoriesEpic from '../category/epic';
import newOrderEpic from '../order/new_order/epic';
import listProductLowStockEpic from '../product/list_products_low_stock/epic';
import listProductsEpic from '../product/list_products/epic';
import listOrderEpic from '../order/list_orders/epic';
import homeEpic from '../home/epic';
import newProductDialogEpic from '../order/new_product_dialog/epic'
import fetchImagesEpic from '../image/epic';

export const rootEpic = combineEpics(
  newProductEpic,
  categoriesEpic,
  listProductLowStockEpic,
  listProductsEpic,
  listOrderEpic,
  newOrderEpic,
  homeEpic,
  newProductDialogEpic,
  fetchImagesEpic
);
