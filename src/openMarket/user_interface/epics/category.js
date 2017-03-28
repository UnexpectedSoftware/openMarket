import {FETCH_CATEGORIES} from "../actions/product";
import {fetchCategoriesFulFilled} from "../actions/product";
import OpenMarket from "../../index";

export const fetchCategoriesEpic = action$ =>
  action$.ofType(FETCH_CATEGORIES)
    .flatMap(action => OpenMarket.get("categories_list_all_use_case").findAll())
    .do(categories => console.log(categories))
    .map(categories => fetchCategoriesFulFilled(categories));
