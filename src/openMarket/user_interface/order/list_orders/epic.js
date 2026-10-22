import * as Rx from 'rxjs';
import 'rxjs/add/operator/do';
import OpenMarket from '../../../application/index';
import {record} from '../../../infrastructure/logging/ErrorLog';
import {
  makeOrderDetailEpic,
  makeOrderPrintEpic,
  makeOrderReprintEpic,
  makeOrdersListEpic
} from './epicFactory';

const orders = OpenMarket.get('orders_list_all_use_case');
const buildReceipt = OpenMarket.get('receipts_build_use_case');
const printReceipt = OpenMarket.get('receipts_print_use_case');

export default action$ =>
  Rx.Observable.merge(
    makeOrdersListEpic(orders)(action$),
    makeOrderDetailEpic(orders)(action$),
    makeOrderReprintEpic(buildReceipt)(action$),
    makeOrderPrintEpic(buildReceipt, printReceipt)(action$)
  ).do(() => null, error => record(error), () => null);
