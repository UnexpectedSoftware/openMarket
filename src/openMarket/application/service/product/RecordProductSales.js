import OrderCreated from '../../../domain/event/OrderCreated';
import {record} from '../../../infrastructure/logging/ErrorLog';
/** @import ProductSaleStatisticsRepository from '../../../domain/product/ProductSaleStatisticsRepository' */
/** @import DomainEventBus from '../../../domain/service/DomainEventBus' */

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
    this._domainEventBus.subscribeDurable('record-product-sales', OrderCreated, event => {
      this._repository.applyOrder({
        orderId: event.id,
        createdAt: event.createdAt,
        lines: event.lines
      });
    }, {ordered: false});
  }

}
