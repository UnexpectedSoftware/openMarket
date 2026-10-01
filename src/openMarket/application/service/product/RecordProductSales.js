import OrderCreated from '../../../domain/event/OrderCreated';

/**
 * Keeps product_sale_day in step with sales. Started once, with the app, because the bus does not replay.
 */
export default class RecordProductSales {

  /**
   * @param {ProductSaleStatisticsRepository} repository
   * @param {DomainEventBus} domainEventBus
   */
  constructor({repository, domainEventBus}) {
    this._repository = repository;
    this._domainEventBus = domainEventBus;
    this._started = false;
  }

  start() {
    if (this._started) {
      return;
    }
    this._started = true;
    if (this._repository.isEmpty()) {
      try {
        this._repository.rebuildFromOrders();
      } catch (error) {
        console.error(error);
      }
    }
    this._domainEventBus.ofType(OrderCreated).subscribe(event => {
      try {
        this._repository.applyOrder({
          createdAt: event.createdAt,
          lines: event.lines
        });
      } catch (error) {
        console.error(error);
      }
    });
  }

}
