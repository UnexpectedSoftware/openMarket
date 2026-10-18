import {reset} from 'redux-form';
import OpenMarket from "../../../application/index";
import * as Rx from "rxjs";
import {record} from '../../../infrastructure/logging/ErrorLog'

import {
  makeNewOrderProductFetchEpic,
  makeNewOrderSaveEpic,
  makePrintButtonClickedEpic,
  makePrinterDialogEpic,
  makeNewOrderSavedEpic,
  makeWeightedDialogEpic,
  makeLowStockWarningEpic,
  makeProductEnabledAgainEpic
} from "./epicFactory";

/* TODO Maybe make a DIC for user_interface layer */
const findProductUseCase = OpenMarket.get("products_find_use_case");
const enableProductUseCase = OpenMarket.get("products_enable_use_case");
const orderCreateUseCase = OpenMarket.get("orders_create_use_case");
const domainEventBus = OpenMarket.get("domain_event_bus");
const buildReceipt = OpenMarket.get('receipts_build_use_case');
const printReceipt = OpenMarket.get('receipts_print_use_case');

const orderProductFetchEpic = makeNewOrderProductFetchEpic(findProductUseCase)(enableProductUseCase)(reset);
const orderSaveEpic = makeNewOrderSaveEpic(orderCreateUseCase)(reset);
const lowStockWarningEpic = makeLowStockWarningEpic(domainEventBus);
const productEnabledAgainEpic = makeProductEnabledAgainEpic(domainEventBus);
const printerDialogEpic = makePrinterDialogEpic(buildReceipt)(printReceipt);
const printButtonClickedEpic = makePrintButtonClickedEpic(buildReceipt)(printReceipt);
const weightedDialogEpic  = makeWeightedDialogEpic(reset)

export default action$ =>
  Rx.Observable.merge(
    orderProductFetchEpic(action$),
    orderSaveEpic(action$),
    printerDialogEpic(action$),
    printButtonClickedEpic(action$),
    makeNewOrderSavedEpic(action$),
    weightedDialogEpic(action$),
    lowStockWarningEpic(),
    productEnabledAgainEpic()
  ).do(() => null, (error) => record(error));
