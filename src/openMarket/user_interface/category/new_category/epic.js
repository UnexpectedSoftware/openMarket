import OpenMarket from "../../../application/index";
import * as Rx from "rxjs";
import * as newCategoryActions from "./action";
import {reset} from 'redux-form';

const saveCategoryEpic = action$ =>

  action$.ofType(newCategoryActions.NEW_CATEGORY_SAVE)
    .flatMap(action => OpenMarket.get("categories_create_use_case").createCategory({
      name: action.category.name
    }))
    .map(saved => newCategoryActions.newCategorySaved());

const savedCategoryEpic = action$ =>
  action$.ofType(newCategoryActions.NEW_CATEGORY_SAVED)
    .map(action => reset('new_category'));

export default action$ =>
  Rx.Observable.merge(
    saveCategoryEpic(action$),
    savedCategoryEpic(action$)
  );
