
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
  makeWeightedDialogEpic
} from "./epicFactory";

/* TODO Maybe make a DIC for user_interface layer */
const findProductUseCase = OpenMarket.get("products_find_use_case");
const orderCreateUseCase = OpenMarket.get("orders_create_use_case");
const orderPrinterService = container.orderPrinterService();

const orderProductFetchEpic = makeNewOrderProductFetchEpic(findProductUseCase)(reset);
const orderSaveEpic = makeNewOrderSaveEpic(orderCreateUseCase)(reset);
const printerDialogEpic = makePrinterDialogEpic(orderPrinterService);
const printButtonClickedEpic = makePrintButtonClickedEpic(orderPrinterService);
const weightedDialogEpic = makeWeightedDialogEpic(reset);

export default action$ =>
  Rx.Observable.merge(
    orderProductFetchEpic(action$),
    orderSaveEpic(action$),
    printerDialogEpic(action$),
    printButtonClickedEpic(action$),
    makeNewOrderSavedEpic(action$),
    weightedDialogEpic(action$)
  );
