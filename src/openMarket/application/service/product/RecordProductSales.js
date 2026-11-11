import OrderCreated from '../../../domain/event/OrderCreated';
import {record} from '../../../infrastructure/logging/ErrorLog';
/** @typedef {import('../../../domain/product/ProductSaleStatisticsRepository').default} ProductSaleStatisticsRepository */
/** @typedef {import('../../../domain/service/DomainEventBus').default} DomainEventBus */

/** The durable subscriber name, kept stable so its delivery rows survive restarts. */
export const RECORD_PRODUCT_SALES = 'record-product-sales';

/**
 * Keeps product_sale_day in step with sales.
 * Started once, with the app. Delivery is durable and keyed by the order id,
 * so a retry after a crash does not add the quantity again.
 */
export default class RecordProductSales {

  /**
   * @param {{repository: ProductSaleStatisticsRepository, domainEventBus: DomainEventBus}} deps
   */
  constructor({repository, domainEventBus}) {
    this._repository = repository;
    this._domainEventBus = domainEventBus;
    this._started = false;
  }

  /**
   * @returns {void}
   */
  start() {
    if (this._started) {
      return;
    }
    this._started = true;
    if (this._repository.isEmpty()) {
      try {
        this._repository.rebuildFromOrders();
      } catch (error) {
        record(error);
      }
    }
    this._domainEventBus.subscribeDurable(RECORD_PRODUCT_SALES, OrderCreated, event => {
      this._repository.applyOrder({
        orderId: event.id,
        createdAt: event.createdAt,
        lines: event.lines
      });
    }, {ordered: false});
  }

}
