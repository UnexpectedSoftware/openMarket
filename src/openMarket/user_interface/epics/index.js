import { combineEpics } from 'redux-observable';
import newProductEpic from '../product/new_product/epic';
import newCategoryEpic from '../category/new_category/epic';
import newOrderEpic from '../order/new_order/epic';
import listProductEpic from '../product/list_products_low_stock/epic';
import listOrderEpic from '../order/list_orders/epic';
import homeEpic from '../home/epic';

export const rootEpic = combineEpics(
  newProductEpic,
  newCategoryEpic,
  listProductEpic,
  listOrderEpic,
  newOrderEpic,
  homeEpic
);
