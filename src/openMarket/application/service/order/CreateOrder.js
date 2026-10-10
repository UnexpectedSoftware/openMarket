import {Observable} from "rxjs/Observable";
import "rxjs/add/operator/do";
import "rxjs/add/operator/map";
import "rxjs/add/operator/toArray";
import OrderCreated from "../../../domain/event/OrderCreated";
import ProductWithLowStock from "../../../domain/event/ProductWithLowStock";

/**
 * @class CreateOrder
 */
export default class CreateOrder {

  /**
   *
   * @param {OrderRepository} orderRepository
   * @param {ProductRepository} productRepository
   * @param {OrderFactory} orderFactory
   * @param {DomainEventBus} domainEventBus
   * @param {Transaction} transaction
   */
  constructor({ orderRepository, productRepository, orderFactory, domainEventBus, transaction}) {
    this._orderRepository = orderRepository;
    this._productRepository = productRepository;
    this._orderFactory = orderFactory;
    this._domainEventBus = domainEventBus;
    this._transaction = transaction;
  }

  /**
   * Create a new Order with all lines
   * @param lines
   * @returns {Observable.<Order>}
   */
  createOrder({lines}) {
    return this._transaction.run(() => this._buildOrder({lines})
      .flatMap(order => this._orderRepository.save({order})
        .flatMap(saved => this._subtrackStock({order: saved}))))
      .do(({order, lowStockProducts}) => {
        this._domainEventBus.publish(new OrderCreated({
          id: order.id,
          createdAt: order.createdAt,
          lines: order.lines
        }));
        lowStockProducts.forEach(product => this._domainEventBus.publish(new ProductWithLowStock({
          barcode: product.barcode,
          name: product.name,
          stock: product.stock,
          stockMin: product.stockMin
        })));
      })
      .map(({order}) => order);
  }

  _buildOrder({lines})  {
    return Observable.create(observer => {
      try {
        const order = this._orderFactory.createWith({lines});
        observer.next(order);
      } catch (error) {
        observer.error(error);
      }
      observer.complete();
    })
  }

  _subtrackStock({order}){
    return Observable.from(order.lines)
      .flatMap(line => this._productRepository.findByBarcode({barcode: line.barcode})
        .map(product => product.subtractStock({quantity: line.quantity}))
        .flatMap(product => this._productRepository.save({product}).map(() => product))
      )
      .toArray()
      .map(products => ({
        order,
        lowStockProducts: products.filter(product => product.isStockLow())
      }));
  }

}


