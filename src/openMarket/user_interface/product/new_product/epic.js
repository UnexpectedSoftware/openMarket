import OpenMarket from "../../../index";
import * as Rx from "rxjs";
import * as newProductActions from "./action";
import {reset} from 'redux-form';

const saveProductEpic = action$ =>

  action$.ofType(newProductActions.NEW_PRODUCT_SAVE)
    .flatMap(action => OpenMarket.get("products_create_or_update_use_case").createOrUpdate({
      id: action.product.id,
      barcode: action.product.barcode,
      name: action.product.name,
      description: action.product.description,
      price: action.product.price,
      basePrice: action.product.basePrice,
      stock: action.product.stock,
      stockMin: action.product.stockMin,
      weighted: action.product.weighted,
      categoryId: action.product.categoryId,
      status: action.product.status
    })
    )
    .map(saved => newProductActions.newProductSaved());

const savedProductEpic = action$ =>
  action$.ofType(newProductActions.NEW_PRODUCT_SAVED)
    .map(action => reset('new_product'))
    .mergeMap(resetAction => Rx.Observable.of(resetAction, newProductActions.newProductFetchCategories()));

const fetchCategoriesEpic = action$ =>
  action$.ofType(newProductActions.NEW_PRODUCT_FETCH_CATEGORIES)
    .flatMap(action => OpenMarket.get("categories_list_all_use_case").findAll())
    .map(categories => newProductActions.newProductFetchedCategories(categories));

export default action$ =>
  Rx.Observable.merge(
    saveProductEpic(action$),
    savedProductEpic(action$),
    fetchCategoriesEpic(action$)
  );
