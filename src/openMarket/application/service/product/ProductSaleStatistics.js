import moment from 'moment';
import {Observable} from 'rxjs/Observable';
import 'rxjs/add/observable/defer';
import 'rxjs/add/observable/of';
import Money from '../../../domain/money/Money';
import Quantity from '../../../domain/money/Quantity';
import {fillSeries, previousYearRange, resolveSalesWindow} from './salesWindows';
/** @import ProductSaleStatisticsRepository from '../../../domain/product/ProductSaleStatisticsRepository' */
/** @import { MostSoldProduct, SalePoint } from '../../../domain/product/ProductSaleStatisticsRepository' */

/**
 * Sales of one product, and the products that sold the most, over a named window.
 */
export default class ProductSaleStatistics {

  /**
   * @param {{repository: ProductSaleStatisticsRepository, clock?: {zonedNow: () => {local: string}}}} deps
   */
  constructor({repository, clock}) {
    this._repository = repository;
    this._clock = clock || null;
  }

  /**
   * The shop's local day. Order dates are stamped in that zone, so a UTC host
   * still counts a sale that happens after midnight in Madrid.
   * @returns {moment.Moment}
   */
  _shopNow() {
    if (!this._clock || typeof this._clock.zonedNow !== 'function') {
      return moment();
    }
    return moment.parseZone(this._clock.zonedNow().local);
  }

  /**
   * @param {{barcode: string, window: string}} query
   * @returns {Observable<{window: string, quantity: number, amount: number, series: SalePoint[]}>}
   */
  salesOfProduct({barcode, window}) {
    return Observable.defer(() => {
      const range = resolveSalesWindow(window, this._shopNow());
      const rows = this._repository.series({
        barcode,
        startOn: range.startOn,
        endOn: range.endOn,
        bucket: range.bucket
      });
      const series = fillSeries({
        startOn: range.startOn,
        endOn: range.endOn,
        bucket: range.bucket,
        rows
      });
      const totals = series.reduce((sum, point) => ({
        quantity: sum.quantity.plus(Quantity.fromDecimal(point.quantity || 0)),
        amount: sum.amount.plus(Money.fromEuros(point.amount || 0))
      }), {quantity: Quantity.ofMilli(0), amount: Money.ofCents(0)});
      return Observable.of({
        window: range.window,
        quantity: totals.quantity.units,
        amount: totals.amount.toEuros(),
        series
      });
    });
  }

  /**
   * @param {object} query
   * @param {string} query.window
   * @param {number} [query.limit]
   * @returns {Observable<{window: string, products: Array<MostSoldProduct & {previousQuantity: number}>}>}
   */
  mostSold({window, limit = 10}) {
    return Observable.defer(() => {
      const range = resolveSalesWindow(window, this._shopNow());
      const previous = previousYearRange(range);
      const products = this._repository.mostSold({
        startOn: range.startOn,
        endOn: range.endOn,
        limit
      });
      const priorRows = this._repository.quantities({
        barcodes: products.map(product => product.barcode),
        startOn: previous.startOn,
        endOn: previous.endOn
      });
      const prior = new Map(priorRows.map(row => [String(row.barcode), row.quantity]));
      return Observable.of({
        window: range.window,
        products: products.map(product => ({
          ...product,
          previousQuantity: prior.get(String(product.barcode)) || 0
        }))
      });
    });
  }

  /**
   * @returns {void}
   */
  rebuildFromOrders() {
    this._repository.rebuildFromOrders();
  }

}
