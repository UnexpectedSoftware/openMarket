import * as Rx from 'rxjs';
import 'rxjs/add/observable/merge';
import OpenMarket from '../../application/index';
import {
  makeCategoriesListEpic,
  makeCategoryDeleteEpic,
  makeCategorySaveEpic
} from './epicFactory';

const listCategories = OpenMarket.get('categories_list_all_use_case');
const createCategory = OpenMarket.get('categories_create_use_case');
const updateCategory = OpenMarket.get('categories_update_use_case');
const deleteCategory = OpenMarket.get('categories_delete_use_case');

export default (action$, store) =>
  Rx.Observable.merge(
    makeCategoriesListEpic(listCategories)(action$, store),
    makeCategorySaveEpic(createCategory, updateCategory)(action$, store),
    makeCategoryDeleteEpic(deleteCategory)(action$)
  );
