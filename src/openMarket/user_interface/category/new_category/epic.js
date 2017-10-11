import OpenMarket from "../../../application/index";
import * as Rx from "rxjs";
import * as newCategoryActions from "./action";
import {reset} from 'redux-form';
import { success, error } from 'react-notification-system-redux';

const saveCategoryEpic = action$ =>

  action$.ofType(newCategoryActions.NEW_CATEGORY_SAVE)
    .flatMap(action => OpenMarket.get("categories_create_use_case").createCategory({
      name: action.category.name
    }))
    .map(saved => newCategoryActions.newCategorySaved());

const savedCategoryEpic = action$ =>
  action$.ofType(newCategoryActions.NEW_CATEGORY_SAVED)
    .flatMap(action => Rx.Observable.of(reset('new_category'),success({
      title: 'Category saved!',
      message: 'Category saved in database',
      position: 'tr',
      autoDismiss: 4
    })));

export default action$ =>
  Rx.Observable.merge(
    saveCategoryEpic(action$),
    savedCategoryEpic(action$)
  );
