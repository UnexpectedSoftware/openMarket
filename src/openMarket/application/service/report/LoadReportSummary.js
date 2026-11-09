import {Observable} from 'rxjs/Observable';
import 'rxjs/add/observable/defer';
import 'rxjs/add/observable/of';
import 'rxjs/add/observable/zip';
import 'rxjs/add/operator/map';
import Money from '../../../domain/money/Money';
import ProductsQuery from '../../../domain/product/ProductsQuery';
import ProductStatus from '../../../domain/product/ProductStatus';
import ReportSummary from '../../../domain/report/ReportSummary';
import {alignDays, eachDay, previousRange} from './reportPeriod';
/** @template T @typedef {import('rxjs/Observable').Observable<T>} ObservableOf */
/** @typedef {import('../../../domain/order/OrderRepository').default} OrderRepository */
/** @typedef {import('../../../domain/product/ProductSaleStatisticsRepository').default} ProductSaleStatisticsRepository */
/** @typedef {import('../../../domain/product/ProductRepository').default} ProductRepository */
/** @typedef {import('../../../domain/report/ReportSummary').default} Summary */

const MOST_SOLD = 5;
const LOW_STOCK = 3;

/**
 * Collects the Resumen screen from the order, sale, and product repositories.
 */
export default class LoadReportSummary {

  /**
   * @param {{orderRepository: OrderRepository, productSaleStatisticsRepository: ProductSaleStatisticsRepository, productRepository: ProductRepository}} deps
   */
  constructor({orderRepository, productSaleStatisticsRepository, productRepository}) {
    this._orders = orderRepository;
    this._sales = productSaleStatisticsRepository;
    this._products = productRepository;
  }

  /**
   * @param {{from: string, to: string}} query
   * @returns {ObservableOf<Summary>}
   */
  load({from, to}) {
    const previous = previousRange({from, to});
    return Observable.zip(
      this._orders.takings({from, to}),
      this._orders.takings(previous),
      Observable.defer(() => Observable.of(this._sales.mostSold({
        startOn: from.slice(0, 10),
        endOn: to.slice(0, 10),
        limit: MOST_SOLD
      }))),
      this._products.find(lowStockQuery()),
      (current, prior, products, stock) => summaryOf({from, to, previous, current, prior, products, stock})
    );
  }

}

/**
 * @returns {ProductsQuery}
 */
function lowStockQuery() {
  return new ProductsQuery({
    lowStock: true,
    status: ProductStatus.ENABLED,
    sort: 'stock_asc',
    limit: LOW_STOCK,
    offset: 0
  });
}

/**
 * @param {object} parts
 * @param {string} parts.from
 * @param {string} parts.to
 * @param {{from: string, to: string}} parts.previous
 * @param {import('../../../domain/order/OrderTakings').default} parts.current
 * @param {import('../../../domain/order/OrderTakings').default} parts.prior
 * @param {Array<{barcode: string, name: string, quantity: number, amount: number}> | null} parts.products
 * @param {{total: number, items: Array<{barcode: string, name: string, stock: number | null, stockMin: number | null, weighted?: boolean}>}} parts.stock
 * @returns {Summary}
 */
function summaryOf({from, to, previous, current, prior, products, stock}) {
  return new ReportSummary({
    from,
    to,
    previousFrom: previous.from,
    previousTo: previous.to,
    salesCents: current.totalCents,
    previousSalesCents: prior.totalCents,
    ticketCount: current.ticketCount,
    previousTicketCount: prior.ticketCount,
    averageCents: current.averageCents,
    previousAverageCents: prior.averageCents,
    units: current.units,
    previousUnits: prior.units,
    days: alignDays({
      dates: eachDay({from, to}),
      currentDays: current.days,
      previousDays: prior.days
    }),
    mostSold: (products || []).map(soldRow),
    lowStockTotal: stock.total,
    lowStockItems: stock.items || []
  });
}

/**
 * @param {{barcode: string, name: string, quantity: number, amount: number}} product
 * @returns {{barcode: string, name: string, quantity: number, amountCents: number}}
 */
function soldRow(product) {
  return {
    barcode: product.barcode,
    name: product.name,
    quantity: product.quantity,
    amountCents: Money.fromEuros(product.amount || 0).cents
  };
}
