
import {reset} from 'redux-form';
import OpenMarket from "../../../index";
import * as Rx from "rxjs";

import OrderPrinterFactory from "../../printer/OrderPrinterFactory";
import PrinterConnection from "../../printer/PrinterConnection";
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
const orderPrinterService = new OrderPrinterFactory({printerConnection: new PrinterConnection()});

const orderProductFetchEpic = makeNewOrderProductFetchEpic(findProductUseCase)(reset);
const orderSaveEpic = makeNewOrderSaveEpic(orderCreateUseCase);
const printerDialogEpic = makePrinterDialogEpic(orderPrinterService);
const printButtonClickedEpic = makePrintButtonClickedEpic(orderPrinterService);


export default action$ =>
  Rx.Observable.merge(
    orderProductFetchEpic(action$),
    orderSaveEpic(action$),
    printerDialogEpic(action$),
    printButtonClickedEpic(action$),
    makeNewOrderSavedEpic(action$),
    makeWeightedDialogEpic(action$)
  );
