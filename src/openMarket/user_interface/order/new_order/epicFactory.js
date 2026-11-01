import * as newOrderActions from "./action";
import * as weightedDialogActions from "../weighted_dialog/action";
import * as Rx from "rxjs";
import {SETTINGS_SAVED} from "../../settings/action";
import ProductWithLowStock from "../../../domain/event/ProductWithLowStock";
import ProductEnabledAgain from "../../../domain/event/ProductEnabledAgain";
import ProductStatus from "../../../domain/product/ProductStatus";
import ErrorCode from "../../../domain/error/ErrorCode";
import Money from "../../../domain/money/Money";
import {record, userText} from "../../../infrastructure/logging/ErrorLog";
import {formatMoney} from "../../i18n/money";
import {toast} from "../../components/toast";
import {lowStockMessage} from "../../low_stock/label";
import "rxjs/add/operator/mergeMap";
import "rxjs/add/operator/filter";
import "rxjs/add/operator/map";
import "rxjs/add/operator/switchMap";
import "rxjs/add/operator/catch";
import "rxjs/add/operator/defaultIfEmpty";
import "rxjs/add/observable/of";
import "rxjs/add/observable/from";
import ProductsQuery from "../../../domain/product/ProductsQuery";
import CategoriesQuery from "../../../domain/category/CategoriesQuery";

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
      orderCreateUseCase.createOrder({
        lines: commandLines(action.order && action.order.lines),
        payment: action.payment
      })
        .mergeMap(savedOrder => Rx.Observable.from(
          savedActions({savedOrder, print: action.print === true, resetForm})
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
      lines: action.payload && action.payload.lines
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
        'Stock bajo',
        lowStockMessage(event),
        {uid: `low-stock-${event.barcode}-${event.stock}`}
      ),
      newOrderActions.noteLowStock({
        barcode: event.barcode,
        stock: event.stock,
        weighted: event.weighted === true
      })
    ))

export const makeProductNotFoundEpic = action$ =>
  action$.ofType(newOrderActions.NEW_ORDER_PRODUCT_NOT_FOUND)
    .map(() => toast.error(
      'Producto no encontrado',
      'Crear producto',
      {uid: `product-not-found-${Date.now()}`}
    ))

export const makeSaleTilesEpic = listProducts => (action$, store) =>
  action$.filter(action => action.type === newOrderActions.SALE_TILES_REQUESTED)
    .switchMap(action => listProducts.list(saleQuery(action.payload, store))
      .map(page => newOrderActions.saleTilesLoaded(tilesOf(page)))
      .catch(() => Rx.Observable.of(newOrderActions.saleTilesFailed())))

export const makeSaleCategoriesEpic = listCategories => action$ =>
  action$.filter(action => action.type === newOrderActions.SALE_CATEGORIES_REQUESTED)
    .switchMap(() => listCategories.list(new CategoriesQuery({sort: 'name_asc'}))
      .map(page => newOrderActions.saleCategoriesLoaded(categoryNames(page)))
      .catch(() => Rx.Observable.of(newOrderActions.saleCategoriesFailed())))

/**
 * The sell screen reads print mode on open and again after settings are saved.
 * @param {{get: Function} | null | undefined} getSellPreferences
 */
export const makeSellPreferencesEpic = getSellPreferences => action$ =>
  action$.filter(action =>
    action.type === newOrderActions.SELL_PREFERENCES_REQUESTED || action.type === SETTINGS_SAVED
  ).switchMap(() => readSellPreferences(getSellPreferences))

/**
 * @param {{text?: string, categoryId?: string | null, limit?: number} | null | undefined} payload
 * @param {{getState?: Function} | null | undefined} store
 * @returns {ProductsQuery}
 */
function saleQuery(payload, store) {
  const request = payload || {};
  const categoryId = Object.prototype.hasOwnProperty.call(request, 'categoryId')
    ? request.categoryId
    : storedCategory(store);
  return new ProductsQuery({
    text: request.text,
    categoryId: categoryId || null,
    limit: request.limit,
    forSale: true
  });
}

/**
 * The chip the cashier picked. A request that omits categoryId keeps it.
 * @param {{getState?: Function} | null | undefined} store
 * @returns {string | null}
 */
function storedCategory(store) {
  const state = store && store.getState ? store.getState() : null;
  const id = state && state.newOrder && state.newOrder.categoryId;
  return id || null;
}

/**
 * @param {{items?: object[]} | null | undefined} page
 * @returns {{id: string, name: string}[]}
 */
function categoryNames(page) {
  return ((page && page.items) || []).filter(item => item && item.id && item.name).map(item => ({
    id: String(item.id),
    name: String(item.name)
  }));
}

/**
 * @param {{items?: object[]}} page
 * @returns {object[]}
 */
function tilesOf(page) {
  return page.items.map(tileOf);
}

/**
 * Fields the sell grid reads off a ProductView.
 * @param {object} view
 * @returns {{barcode: string, name: string, priceCents: number, vat: object | null, weighted: boolean, lowStock: boolean, stock: number | null, imageUrl: string | null}}
 */
function tileOf(view) {
  return {
    barcode: view.barcode,
    name: view.name,
    priceCents: view.priceCents,
    vat: view.vat,
    weighted: view.weighted,
    lowStock: view.lowStock,
    stock: view.stock == null ? null : view.stock,
    imageUrl: view.imageUrl
  };
}

/**
 * The till's stored print choice. A missing read asks.
 * @param {{get: Function} | null | undefined} useCase
 * @returns {Rx.Observable<object>}
 */
function readSellPreferences(useCase) {
  if (!useCase || typeof useCase.get !== 'function') {
    return Rx.Observable.of(newOrderActions.sellPreferencesLoaded(null));
  }
  return useCase.get()
    .map(view => newOrderActions.sellPreferencesLoaded(view))
    .defaultIfEmpty(newOrderActions.sellPreferencesLoaded(null))
    .catch(() => Rx.Observable.of(newOrderActions.sellPreferencesLoaded(null)));
}

/**
 * A paid sale prints only when checkout said so. An unpaid sale never prints.
 * @param {{savedOrder: {id: string, payment?: {method?: string, changeCents?: number}}, print?: boolean, resetForm: Function}} params
 * @returns {object[]}
 */
export function savedActions({savedOrder, print, resetForm}) {
  const paid = !!(savedOrder && savedOrder.payment);
  const notice = toast.success('Order saved!', savedMessage(savedOrder), {
    uid: `order-saved-${savedOrder.id}`
  });
  const actions = [notice, resetForm('new_order'), newOrderActions.newOrderSaved(savedOrder)];
  if (paid && print === true) {
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
