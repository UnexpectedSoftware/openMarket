import * as newOrderActions from "./action";
import * as weightedDialogActions from "../weighted_dialog/action";
import * as Rx from "rxjs";
import {HIDE_PRINTER_DIALOG} from "../printer_dialog/action";
import {showPrinterDialog} from "../printer_dialog/action";
import ProductWithLowStock from "../../../domain/event/ProductWithLowStock";
import ProductEnabledAgain from "../../../domain/event/ProductEnabledAgain";
import ProductStatus from "../../../domain/product/ProductStatus";
import ErrorCode from "../../../domain/error/ErrorCode";
import {record, userText} from "../../../infrastructure/logging/ErrorLog";
import {toast} from "../../components/toast";

export const makeNewOrderProductFetchEpic = findProductUseCase => enableProductUseCase => resetForm => action$ =>
  action$
    .filter(action => action.type === newOrderActions.NEW_ORDER_PRODUCT_FETCH)
    .flatMap(action => findProductUseCase.findProductByBarcode({barcode: action.barcode})
      .flatMap(product => product.status === ProductStatus.DISABLED
        ? enableProductUseCase.enableForSale({barcode: action.barcode})
        : Rx.Observable.of(product))
      .map(product => !product.isWeighted ? newOrderActions.newOrderProductFetched({product:product,quantity:1}): weightedDialogActions.showWeightedDialog(product))
      .defaultIfEmpty(newOrderActions.newOrderProductNotFound(action.barcode))
      .mergeMap(nextAction => Rx.Observable.of(resetForm('new_order'), nextAction))
    );

export const makeNewOrderSaveEpic = orderCreateUseCase => resetForm => action$ =>
  action$
    .filter(action => action.type === newOrderActions.NEW_ORDER_SAVE)
    .flatMap(action =>
      orderCreateUseCase.createOrder({lines:action.order.lines})
        .map(savedOrder => newOrderActions.newOrderSaved(savedOrder))
        .mergeMap(action => Rx.Observable.of(toast.success(
          'Order saved!',
          'Order is saved in database',
          {uid: `order-saved-${action.payload.id}`}
        ), resetForm('new_order'), action))
        .catch(err => {
          record(err);
          const message = userText(err, 'Order was not saved');
          const notice = toast.error(
            err && err.code === ErrorCode.ORDER_LINES_EMPTY ? 'Empty lines!' : 'Order was not saved',
            message,
            {uid: `order-not-saved-${Date.now()}`}
          );
          return Rx.Observable.of(resetForm('new_order'), notice);
        })
    );

function printFailed(err) {
  record(err);
  return toast.error('Print failed', userText(err, 'Print failed'), {
    uid: `print-failed-${Date.now()}`
  });
}

function printReceipt(buildReceipt, printReceiptUseCase, order) {
  return buildReceipt.build({orderId: order && order.id})
    .flatMap(receipt => printReceiptUseCase.print({receipt}));
}

export const makePrinterDialogEpic = buildReceipt => printReceiptUseCase => action$ =>
  action$.filter(action => action.type === HIDE_PRINTER_DIALOG)
    .filter(action => true === action.payload.print)
    .flatMap(action => printReceipt(buildReceipt, printReceiptUseCase, action.payload.order)
      .map(() => newOrderActions.printOrderFinished())
      .catch(err => Rx.Observable.of(printFailed(err))));

export const makePrintButtonClickedEpic = buildReceipt => printReceiptUseCase => action$ =>
  action$.filter(action => action.type === newOrderActions.PRINT_ORDER_BUTTON_CLICKED)
    .flatMap(action => printReceipt(buildReceipt, printReceiptUseCase, action.payload)
      .map(() => newOrderActions.printOrderFinished())
      .catch(err => Rx.Observable.of(printFailed(err))));

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

export const makeLowStockWarningEpic = domainEventBus => () =>
  domainEventBus.ofType(ProductWithLowStock)
    .map(event => toast.warning(
      'Stock is low',
      `${event.name} has ${event.stock} left (minimum ${event.stockMin}).`,
      {uid: `low-stock-${event.barcode}-${event.stock}`}
    ))

export const makeProductEnabledAgainEpic = domainEventBus => () =>
  domainEventBus.ofType(ProductEnabledAgain)
    .map(event => toast.warning(
      'Product enabled',
      `${event.name} has been enabled again and the stock was increased by +1.`,
      {uid: `product-enabled-${event.barcode}`}
    ))
