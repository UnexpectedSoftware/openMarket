import { combineEpics } from 'redux-observable';
import newProductEpic from '../product/new_product/epic';
export const rootEpic = combineEpics(
  newProductEpic
);
