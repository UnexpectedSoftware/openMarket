import { success, error, warning } from 'react-notification-system-redux';
import {reset} from 'redux-form';
import OpenMarket from "../../../application/index";
import * as Rx from "rxjs";
import container from '../../../infrastructure/dic/Container'

import {
  makeNewOrderProductFetchEpic,
  makeNewOrderSaveEpic,
  makePrintButtonClickedEpic,
  makePrinterDialogEpic,
  makeNewOrderSavedEpic,
  makeWeightedDialogEpic,
  makeLowStockWarningEpic
} from "./epicFactory";

/* TODO Maybe make a DIC for user_interface layer */
const findProductUseCase = OpenMarket.get("products_find_use_case");
const orderCreateUseCase = OpenMarket.get("orders_create_use_case");
const domainEventBus = OpenMarket.get("domain_event_bus");
const orderPrinterService = container.getInstance({key:'orderPrinterService'});

const orderProductFetchEpic = makeNewOrderProductFetchEpic(findProductUseCase)(reset);
const orderSaveEpic = makeNewOrderSaveEpic(orderCreateUseCase)(reset)(error)(success);
const lowStockWarningEpic = makeLowStockWarningEpic(domainEventBus)(warning);
const printerDialogEpic = makePrinterDialogEpic(orderPrinterService);
const printButtonClickedEpic = makePrintButtonClickedEpic(orderPrinterService);
const weightedDialogEpic  = makeWeightedDialogEpic(reset)

export default action$ =>
  Rx.Observable.merge(
    orderProductFetchEpic(action$),
    orderSaveEpic(action$),
    printerDialogEpic(action$),
    printButtonClickedEpic(action$),
    makeNewOrderSavedEpic(action$),
    weightedDialogEpic(action$),
    lowStockWarningEpic()
  ).do(()=> null,(error) => console.log(error));
