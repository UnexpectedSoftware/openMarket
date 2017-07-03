import * as newOrderActions from "./action";
import OpenMarket from "../../../index";
import * as Rx from "rxjs";
import {reset} from 'redux-form';

const newOrderProductFetch = action$ =>
  action$.ofType(newOrderActions.NEW_ORDER_PRODUCT_FETCH)
    .flatMap(action => OpenMarket.get("products_find_use_case").findProductByBarcode({barcode: action.barcode}))
    .map(product => newOrderActions.newOrderProductFetched(product))
    .mergeMap(action => Rx.Observable.of(reset('new_order'),action));


const newOrderSave = action$ =>
  action$.ofType(newOrderActions.NEW_ORDER_SAVE)
    .flatMap(action => OpenMarket.get("orders_create_use_case").createOrder({lines:action.order.lines}))
    .map(savedOrder => newOrderActions.newOrderSaved())
    .mergeMap(action => Rx.Observable.of(reset('new_order'),action));



export default action$ =>
  Rx.Observable.merge(
    newOrderProductFetch(action$),
    newOrderSave(action$)
  );

