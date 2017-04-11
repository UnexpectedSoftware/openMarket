import {reset} from 'redux-form';
import OpenMarket from "../../../index";
import * as Rx from "rxjs";
import * as newProductActions from "./action";

const saveProductEpic = action$ =>
  Rx.Observable.merge(
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
        imageUrl: action.product.imageUrl,
        categoryId: action.product.categoryId,
        status: action.product.status
      })
      )
      .map(saved => newProductActions.newProductSaved()),
    Rx.Observable.of(reset("new_product"))
  );


const fetchCategoriesEpic = action$ =>
  action$.ofType(newProductActions.NEW_PRODUCT_FETCH_CATEGORIES)
    .flatMap(action => OpenMarket.get("categories_list_all_use_case").findAll())
    .map(categories => newProductActions.newProductFetchedCategories(categories));

export default action$ =>
  Rx.Observable.merge(
    saveProductEpic(action$),
    fetchCategoriesEpic(action$)
  );
