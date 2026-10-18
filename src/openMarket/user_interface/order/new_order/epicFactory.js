import * as newOrderActions from "./action";
import * as weightedDialogActions from "../weighted_dialog/action";
import * as Rx from "rxjs";
import {HIDE_PRINTER_DIALOG} from "../printer_dialog/action";
import ProductWithLowStock from "../../../domain/event/ProductWithLowStock";
import ProductEnabledAgain from "../../../domain/event/ProductEnabledAgain";
import ProductStatus from "../../../domain/product/ProductStatus";
import ErrorCode from "../../../domain/error/ErrorCode";
import Money from "../../../domain/money/Money";
import {record, userText} from "../../../infrastructure/logging/ErrorLog";
import {formatMoney} from "../../i18n/money";
import {toast} from "../../components/toast";
import "rxjs/add/operator/switchMap";
import "rxjs/add/operator/defaultIfEmpty";
import "rxjs/add/observable/of";
import "rxjs/add/observable/from";

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

export const makeNewOrderSaveEpic = (orderCreateUseCase, getSellPreferences) => resetForm => (action$, store) =>
  action$
    .filter(action => action.type === newOrderActions.NEW_ORDER_SAVE)
    .flatMap(action =>
      orderCreateUseCase.createOrder({
        lines: commandLines(action.order && action.order.lines),
        payment: action.payment
      })
        .flatMap(savedOrder => sellPreferences(getSellPreferences)
          .map(preferences => ({savedOrder, preferences})))
        .mergeMap(({savedOrder, preferences}) => Rx.Observable.from(
          savedActions({savedOrder, preferences, resetForm, store})
        ))
        .catch(err => {
          record(err);
          const message = userText(err, 'Order was not saved');
          const notice = toast.error(
            err && err.code === ErrorCode.ORDER_LINES_EMPTY ? 'Empty lines!' : 'Order was not saved',
            message,
            {uid: `order-not-saved-${Date.now()}`}
          );
          return Rx.Observable.of(resetForm('new_order'), notice, newOrderActions.paymentFailed());
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
      quantity:action.payload.quantity,
      replace: action.payload.replace
    }))
    .mergeMap(action => Rx.Observable.of(resetForm('new_order'),action));

export const makePaymentPreviewEpic = buildReceipt => action$ =>
  action$.ofType(newOrderActions.PAYMENT_PREVIEW_REQUESTED)
    .switchMap(action => buildReceipt.preview({
      lines: action.payload && action.payload.lines,
      issuer: action.payload && action.payload.issuer
    })
      .map(receipt => newOrderActions.paymentPreviewLoaded(receipt.html))
      .catch(() => Rx.Observable.of(newOrderActions.paymentPreviewLoaded(''))));

export const makeReprintPreviewEpic = buildReceipt => action$ =>
  action$.ofType(newOrderActions.REPRINT_PREVIEW_REQUESTED)
    .switchMap(action => buildReceipt.build({
      orderId: action.payload && action.payload.orderId
    })
      .map(receipt => newOrderActions.reprintPreviewLoaded(receipt.html))
      .catch(() => Rx.Observable.of(newOrderActions.reprintPreviewLoaded(''))));

export const makeLowStockWarningEpic = domainEventBus => () =>
  domainEventBus.ofType(ProductWithLowStock)
    .mergeMap(event => Rx.Observable.of(
      toast.warning(
        'Stock is low',
        `${event.name} has ${event.stock} left (minimum ${event.stockMin}).`,
        {uid: `low-stock-${event.barcode}-${event.stock}`}
      ),
      newOrderActions.noteLowStock({barcode: event.barcode})
    ))

export const makeProductNotFoundEpic = action$ =>
  action$.ofType(newOrderActions.NEW_ORDER_PRODUCT_NOT_FOUND)
    .map(() => toast.error(
      'Producto no encontrado',
      'Crear producto',
      {uid: `product-not-found-${Date.now()}`}
    ))

export const makeSaleTilesEpic = productsQuery => action$ =>
  action$.ofType(newOrderActions.SALE_TILES_REQUESTED)
    .switchMap(action => productsQuery.listForSale(action.payload || {})
      .map(tiles => newOrderActions.saleTilesLoaded(tiles))
      .catch(() => Rx.Observable.of(newOrderActions.saleTilesFailed())))

/**
 * @param {{get: Function} | null | undefined} useCase
 * @returns {Rx.Observable<{autoPrint: boolean}>}
 */
function sellPreferences(useCase) {
  if (!useCase || typeof useCase.get !== 'function') {
    return Rx.Observable.of({autoPrint: false});
  }
  return useCase.get().map(preferences => ({
    autoPrint: !!(preferences && preferences.autoPrint)
  })).defaultIfEmpty({autoPrint: false});
}

/**
 * @param {{savedOrder: {id: string, payment?: {method?: string, changeCents?: number}}, preferences: {autoPrint: boolean}, resetForm: Function, store?: {dispatch: Function}}} params
 * @returns {object[]}
 */
function savedActions({savedOrder, preferences, resetForm, store}) {
  const paid = savedOrder && savedOrder.payment;
  const autoPrint = !!(preferences && preferences.autoPrint && paid);
  const notice = toast.success('Order saved!', savedMessage(savedOrder), {
    uid: `order-saved-${savedOrder.id}`,
    autoDismiss: paid && !autoPrint ? 0 : undefined,
    action: paid && !autoPrint ? {
      label: 'Imprimir ticket',
      callback: () => {
        if (store && store.dispatch) {
          store.dispatch(newOrderActions.printOrderButtonClicked(savedOrder));
        }
      }
    } : undefined
  });
  const actions = [notice, resetForm('new_order'), newOrderActions.newOrderSaved(savedOrder)];
  if (autoPrint) {
    actions.push(newOrderActions.printOrderButtonClicked(savedOrder));
  }
  return actions;
}

/**
 * @param {{payment?: {method?: string, changeCents?: number}} | null | undefined} order
 * @returns {string}
 */
function savedMessage(order) {
  const payment = order && order.payment;
  if (!payment) {
    return 'Order is saved in database';
  }
  if (payment.method === 'card') {
    return 'Pagado con tarjeta';
  }
  return 'Cambio ' + formatMoney(Money.ofCents(payment.changeCents || 0));
}

/**
 * The cart stores Money and Quantity. CreateOrder still receives price, quantity, and kind.
 * @param {object[] | null | undefined} lines
 * @returns {object[]}
 */
function commandLines(lines) {
  return (lines || []).map(line => {
    const kind = line && line.kind === 'FREE' ? 'FREE' : 'PRODUCT';
    const price = line && (line.unitPrice != null ? line.unitPrice : line.price);
    return {
      kind,
      barcode: kind === 'FREE' ? '' : (line && line.barcode),
      name: line && line.name,
      description: line && line.name,
      price,
      quantity: line && line.quantity,
      vatRate: line && (line.vatRate || line.vat),
      weighted: line && line.weighted,
      amount: kind === 'FREE' ? price : undefined
    };
  });
}

export const makeProductEnabledAgainEpic = domainEventBus => () =>
  domainEventBus.ofType(ProductEnabledAgain)
    .map(event => toast.warning(
      'Product enabled',
      `${event.name} has been enabled again and the stock was increased by +1.`,
      {uid: `product-enabled-${event.barcode}`}
    ))
