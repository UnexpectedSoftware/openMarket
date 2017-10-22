import OpenMarket from "../../../application/index";
import * as Rx from "rxjs";
import { success, error } from 'react-notification-system-redux';
import {
  makeNewProductDialogEpic,
  makeNewProductSavedDialogEpic
} from "./epicFactory";

import container from '../../../infrastructure/dic/Container'

const productCreateUseCase = OpenMarket.get("products_create_or_update_use_case");
const productDefaults = container.environment.config.productDefaults;

const newProductSavedDialogEpic = makeNewProductSavedDialogEpic(productCreateUseCase)({messaging:{success,error}})(productDefaults);

export default action$ =>
  Rx.Observable.merge(
    makeNewProductDialogEpic(action$),
    newProductSavedDialogEpic(action$)
  ).do(()=> null,(error) => console.log(error));
