import {reset} from 'redux-form';
import OpenMarket from "../../../application/index";
import * as Rx from "rxjs";
import {record} from '../../../infrastructure/logging/ErrorLog'

import {
  makeNewOrderProductFetchEpic,
  makeNewOrderSaveEpic,
  makePrintButtonClickedEpic,
  makePrinterDialogEpic,
  makePaymentPreviewEpic,
  makeReprintPreviewEpic,
  makeWeightedDialogEpic,
  makeLowStockWarningEpic,
  makeProductEnabledAgainEpic,
  makeProductNotFoundEpic,
  makeSaleTilesEpic,
  makeSaleCategoriesEpic
} from "./epicFactory";

/* TODO Maybe make a DIC for user_interface layer */
const findProductUseCase = OpenMarket.get("products_find_use_case");
const enableProductUseCase = OpenMarket.get("products_enable_use_case");
const orderCreateUseCase = OpenMarket.get("orders_create_use_case");
const domainEventBus = OpenMarket.get("domain_event_bus");
const buildReceipt = OpenMarket.get('receipts_build_use_case');
const printReceipt = OpenMarket.get('receipts_print_use_case');
const listProducts = OpenMarket.get('products_list_all_use_case');
const listCategories = OpenMarket.get('categories_list_all_use_case');
const getSellPreferences = OpenMarket.get('sell_get_preferences_use_case');

const orderProductFetchEpic = makeNewOrderProductFetchEpic(findProductUseCase)(enableProductUseCase)(reset);
const orderSaveEpic = makeNewOrderSaveEpic(orderCreateUseCase, getSellPreferences)(reset);
const lowStockWarningEpic = makeLowStockWarningEpic(domainEventBus);
const productEnabledAgainEpic = makeProductEnabledAgainEpic(domainEventBus);
const printerDialogEpic = makePrinterDialogEpic(buildReceipt)(printReceipt);
const printButtonClickedEpic = makePrintButtonClickedEpic(buildReceipt)(printReceipt);
const weightedDialogEpic  = makeWeightedDialogEpic(reset)

export default (action$, store) =>
  Rx.Observable.merge(
    orderProductFetchEpic(action$),
    orderSaveEpic(action$, store),
    printerDialogEpic(action$),
    printButtonClickedEpic(action$),
    makePaymentPreviewEpic(buildReceipt)(action$),
    makeReprintPreviewEpic(buildReceipt)(action$),
    weightedDialogEpic(action$),
    makeProductNotFoundEpic(action$),
    makeSaleTilesEpic(listProducts)(action$, store),
    makeSaleCategoriesEpic(listCategories)(action$),
    lowStockWarningEpic(),
    productEnabledAgainEpic()
  ).do(() => null, (error) => record(error));
