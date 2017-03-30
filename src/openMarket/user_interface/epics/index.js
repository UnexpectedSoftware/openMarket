import { combineEpics } from 'redux-observable';
import {fetchCategoriesEpic} from '../epics/category';
import {saveProductEpic} from '../epics/product';
export const rootEpic = combineEpics(
  fetchCategoriesEpic,
  saveProductEpic
);
