import * as newOrderActions from "./action";
import * as weightedDialogActions from "../weighted_dialog/action";
import OpenMarket from "../../../index";
import * as Rx from "rxjs";
import {reset} from 'redux-form';
import orderPrinterService from "../../service/OrderPrinterService";

const newOrderProductFetch = action$ =>
  action$.ofType(newOrderActions.NEW_ORDER_PRODUCT_FETCH)
    .flatMap(action => OpenMarket.get("products_find_use_case").findProductByBarcode({barcode: action.barcode})
      .map(product => !product.isWeighted ? newOrderActions.newOrderProductFetched({product:product,quantity:1}): weightedDialogActions.showWeightedDialog(product))
      .defaultIfEmpty(newOrderActions.newOrderProductNotFound({ message:`Product with barcode ${action.barcode} not found!` }))
      .mergeMap(action => Rx.Observable.of(reset('new_order'),action))
    );


const newOrderSave = action$ =>
  action$.ofType(newOrderActions.NEW_ORDER_SAVE)
    .flatMap(action => OpenMarket.get("orders_create_use_case").createOrder({lines:action.order.lines}))
    .map(savedOrder => newOrderActions.newOrderSaved(savedOrder))
    .mergeMap(action => Rx.Observable.of(reset('new_order'),action));


const weightedDialogEpic = action$ =>
  action$.ofType(weightedDialogActions.HIDE_WEIGHTED_DIALOG)
    .map(action => newOrderActions.newOrderProductFetched({
      product:action.payload.product,
      quantity:action.payload.quantity
    }))
    .mergeMap(action => Rx.Observable.of(reset('new_order'),action));

const newOrderSavedEpic = action$ =>
  action$.ofType(newOrderActions.NEW_ORDER_SAVED)
    .flatMap(action => orderPrinterService.print({order: action.payload}));

export default action$ =>
  Rx.Observable.merge(
    newOrderProductFetch(action$),
    newOrderSave(action$),
    weightedDialogEpic(action$),
    newOrderSavedEpic(action$)
  );

