import { combineEpics } from 'redux-observable';
import newProductEpic from '../product/new_product/epic';
import newCategoryEpic from '../category/new_category/epic';
import listProductEpic from '../product/list_products/epic';
export const rootEpic = combineEpics(
  newProductEpic,
  newCategoryEpic,
  listProductEpic
);
