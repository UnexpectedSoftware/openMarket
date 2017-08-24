import * as newOrderActions from "./action";
import * as weightedDialogActions from "../weighted_dialog/action";
import OpenMarket from "../../../index";
import * as Rx from "rxjs";
import {reset} from 'redux-form';

const newOrderProductFetch = action$ =>
  action$.ofType(newOrderActions.NEW_ORDER_PRODUCT_FETCH)
    .flatMap(action => OpenMarket.get("products_find_use_case").findProductByBarcode({barcode: action.barcode})
      .map(product => !product.isWeighted ? newOrderActions.newOrderProductFetched({product:product,quantity:1}): weightedDialogActions.showWeightedDialog(product))
      .defaultIfEmpty(newOrderActions.newOrderProductNotFound({ message:`Product with barcode ${action.barcode} not found!` }))
      .mergeMap(action => Rx.Observable.of(reset('new_order'),action))
    );


const newOrderSave = action$ =>
  action$.ofType(newOrderActions.NEW_ORDER_SAVE)
    .flatMap(action => Rx.Observable.from(action.order.lines)
      .map(line => ({barcode: line.barcode, name: line.name, price: line.price, quantity: line.quantity}))
      .toArray())
    .flatMap(lines => OpenMarket.get("orders_create_use_case").createOrder({lines:lines}))
    .map(savedOrder => newOrderActions.newOrderSaved())
    .mergeMap(action => Rx.Observable.of(reset('new_order'),action));


const weightedDialogEpic = action$ =>
  action$.ofType(weightedDialogActions.HIDE_WEIGHTED_DIALOG)
    .map(action => newOrderActions.newOrderProductFetched({product:action.payload.product,quantity:action.payload.quantity}))
    .mergeMap(action => Rx.Observable.of(reset('new_order'),action))



export default action$ =>
  Rx.Observable.merge(
    newOrderProductFetch(action$),
    newOrderSave(action$),
    weightedDialogEpic(action$)
  );

