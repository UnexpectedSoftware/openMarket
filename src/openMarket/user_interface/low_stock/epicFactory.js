import * as Rx from 'rxjs';
import 'rxjs/add/observable/of';
import 'rxjs/add/operator/catch';
import 'rxjs/add/operator/filter';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/switchMap';
import ProductEnabledAgain from '../../domain/event/ProductEnabledAgain';
import ProductWithLowStock from '../../domain/event/ProductWithLowStock';
import {NEW_PRODUCT_SAVED} from '../product/new_product/action';
import {
  LIST_PRODUCTS_DISABLED,
  PRODUCTS_ARCHIVED,
  PRODUCTS_SAVED
} from '../product/list_products/action';
import {
  LOW_STOCK_COUNT_REQUESTED,
  lowStockCountFailed,
  lowStockCountLoaded,
  lowStockCountRequested
} from './action';

const REFRESH_ON = [
  PRODUCTS_SAVED,
  PRODUCTS_ARCHIVED,
  LIST_PRODUCTS_DISABLED,
  NEW_PRODUCT_SAVED
];

/**
 * @param {{countProductsWithLowStock: function(): Rx.Observable<number>}} statistics
 */
export const makeLowStockCountEpic = statistics => action$ =>
  action$.filter(action => action.type === LOW_STOCK_COUNT_REQUESTED)
    .switchMap(() => statistics.countProductsWithLowStock()
      .map(count => lowStockCountLoaded(count))
      .catch(() => Rx.Observable.of(lowStockCountFailed())));

/**
 * Asks for a fresh count after a sale, a re-enable, or a catalog write.
 * @param {{ofType: function(Function): Rx.Observable}} domainEventBus
 */
export const makeLowStockCountRefreshEpic = domainEventBus => action$ =>
  Rx.Observable.merge(
    domainEventBus.ofType(ProductWithLowStock).map(() => lowStockCountRequested()),
    domainEventBus.ofType(ProductEnabledAgain).map(() => lowStockCountRequested()),
    action$.filter(action => REFRESH_ON.indexOf(action.type) !== -1)
      .map(() => lowStockCountRequested())
  );
