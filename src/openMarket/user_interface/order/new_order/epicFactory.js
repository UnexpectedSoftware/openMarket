import * as newOrderActions from "./action";
import * as weightedDialogActions from "../weighted_dialog/action";
import * as Rx from "rxjs";
import {HIDE_PRINTER_DIALOG} from "../printer_dialog/action";
import {showPrinterDialog} from "../printer_dialog/action";

export const makeNewOrderProductFetchEpic = findProductUseCase => resetForm => action$ =>
  action$
    .filter(action => action.type === newOrderActions.NEW_ORDER_PRODUCT_FETCH)
    .flatMap(action => findProductUseCase.findProductByBarcode({barcode: action.barcode})
      .map(product => !product.isWeighted ? newOrderActions.newOrderProductFetched({product:product,quantity:1}): weightedDialogActions.showWeightedDialog(product))
      .defaultIfEmpty(newOrderActions.newOrderProductNotFound(action.barcode))
      .mergeMap(action => Rx.Observable.of(resetForm('new_order'),action))
    );

export const makeNewOrderSaveEpic = orderCreateUseCase => resetForm => errorNotification => successNotification => action$ =>
  action$
    .filter(action => action.type === newOrderActions.NEW_ORDER_SAVE)
    .flatMap(action =>
      orderCreateUseCase.createOrder({lines:action.order.lines})
        .map(savedOrder => newOrderActions.newOrderSaved(savedOrder))
        .mergeMap(action => Rx.Observable.of(successNotification({
          title: 'Order saved!',
          message: 'Order is saved in database',
          position: 'tr',
          autoDismiss: 4
        }),resetForm('new_order'),action))
        .catch(err =>
          Rx.Observable.of(errorNotification({
            title: 'Empty lines!',
            message: err.message,
            position: 'tr',
            autoDismiss:5
          }))
            .mergeMap(action => Rx.Observable.of(resetForm('new_order'),action))
        )
    );

export const makePrinterDialogEpic = orderPrinterService => action$ =>
  action$.ofType(HIDE_PRINTER_DIALOG)
    .filter(action => true === action.payload.print)
    .flatMap(action => orderPrinterService.print({order: action.payload.order}))
    .map(result => newOrderActions.printOrderFinished());

export const makePrintButtonClickedEpic = orderPrinterService => action$ =>
  action$.ofType(newOrderActions.PRINT_ORDER_BUTTON_CLICKED)
    .flatMap(action => orderPrinterService.print({order: action.payload}))
    .map(result => newOrderActions.printOrderFinished());

export const makeWeightedDialogEpic = resetForm => action$ =>
  action$.ofType(weightedDialogActions.HIDE_WEIGHTED_DIALOG)
    .map(action => newOrderActions.newOrderProductFetched({
      product:action.payload.product,
      quantity:action.payload.quantity
    }))
    .mergeMap(action => Rx.Observable.of(resetForm('new_order'),action));

export const makeNewOrderSavedEpic = action$ =>
  action$.ofType(newOrderActions.NEW_ORDER_SAVED)
    .map(action => showPrinterDialog(action.payload));
