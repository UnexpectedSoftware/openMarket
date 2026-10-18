import OpenMarket from "../../../application/index";
import * as Rx from "rxjs";
import {
  makeNewProductDialogEpic,
  makeNewProductSavedDialogEpic
} from "./epicFactory";

import container from '../../../infrastructure/dic/Container'
import {record} from '../../../infrastructure/logging/ErrorLog'

const productCreateUseCase = OpenMarket.get("products_create_or_update_use_case");
const productDefaults = container.environment.config.productDefaults;

const newProductSavedDialogEpic = makeNewProductSavedDialogEpic(productCreateUseCase)(productDefaults);

export default action$ =>
  Rx.Observable.merge(
    makeNewProductDialogEpic(action$),
    newProductSavedDialogEpic(action$)
  ).do(() => null, (error) => record(error));
