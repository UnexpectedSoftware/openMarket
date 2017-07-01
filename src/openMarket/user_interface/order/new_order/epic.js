import * as newOrderActions from "./action";
import OpenMarket from "../../../index";
import * as Rx from "rxjs";
import {reset} from 'redux-form';

export default action$ =>
  action$.ofType(newOrderActions.NEW_ORDER_PRODUCT_FETCH)
    .flatMap(action => OpenMarket.get("products_find_use_case").findProductByBarcode({barcode: action.barcode}))
    .map(product => newOrderActions.newOrderProductFetched(product))
    .mergeMap(action => Rx.Observable.of(reset('new_order'),action));
