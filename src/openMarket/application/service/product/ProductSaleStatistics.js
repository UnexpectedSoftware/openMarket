import {Observable} from 'rxjs/Observable';
import 'rxjs/add/observable/defer';
import 'rxjs/add/observable/of';
import {add} from '../../../infrastructure/service/floatCalculatorService';
import {fillSeries, previousYearRange, resolveSalesWindow} from './salesWindows';

/**
 * Sales of one product, and the products that sold the most, over a named window.
 */
export default class ProductSaleStatistics {

  /**
   * @param {ProductSaleStatisticsRepository} repository
   */
  constructor({repository}) {
    this._repository = repository;
  }

  /**
   * @param {string} barcode
   * @param {string} window
   * @returns {Observable.<{window: string, quantity: number, amount: number, series: Array}>}
   */
  salesOfProduct({barcode, window}) {
    return Observable.defer(() => {
      const range = resolveSalesWindow(window);
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
        quantity: add(sum.quantity, point.quantity),
        amount: add(sum.amount, point.amount)
      }), {quantity: 0, amount: 0});
      return Observable.of({
        window: range.window,
        quantity: totals.quantity,
        amount: totals.amount,
        series
      });
    });
  }

  /**
   * @param {string} window
   * @param {number} [limit]
   * @returns {Observable.<{window: string, products: Array}>}
   */
  mostSold({window, limit = 10}) {
    return Observable.defer(() => {
      const range = resolveSalesWindow(window);
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

  rebuildFromOrders() {
    this._repository.rebuildFromOrders();
  }

}
