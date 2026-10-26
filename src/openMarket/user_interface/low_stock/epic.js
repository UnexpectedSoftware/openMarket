import * as Rx from 'rxjs';
import 'rxjs/add/operator/do';
import OpenMarket from '../../application/index';
import {record} from '../../infrastructure/logging/ErrorLog';
import {makeLowStockCountEpic, makeLowStockCountRefreshEpic} from './epicFactory';

const statistics = OpenMarket.get('products_statistics_use_case');
const domainEventBus = OpenMarket.get('domain_event_bus');

export default action$ =>
  Rx.Observable.merge(
    makeLowStockCountEpic(statistics)(action$),
    makeLowStockCountRefreshEpic(domainEventBus)(action$)
  ).do(() => null, error => record(error), () => null);
