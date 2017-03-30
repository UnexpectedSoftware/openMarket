import {SAVE_PRODUCT} from "../actions/product";
import {productSaved} from "../actions/product";
import {reset} from 'redux-form';
import OpenMarket from "../../index";
import * as Rx from "rxjs";

export const saveProductEpic = action$ =>
  Rx.Observable.merge(
    action$.ofType(SAVE_PRODUCT)
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
      .map(saved => productSaved()),
    Rx.Observable.of(reset("new_product"))
  );


