import {Observable} from "rxjs/Observable";
import "rxjs/add/operator/toArray";
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
   */
  constructor({ orderRepository, productRepository, orderFactory, domainEventBus}) {
    this._orderRepository = orderRepository;
    this._productRepository = productRepository;
    this._orderFactory = orderFactory;
    this._domainEventBus = domainEventBus;
  }

  /**
   * Create a new Order with all lines
   * @param lines
   * @returns {Observable.<Order>}
   */
  createOrder({lines}) {
      return this._buildOrder({lines})
      .flatMap(order => this._orderRepository.save({order}))
      .flatMap(order => this._subtrackStock({order}));

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
      .map(products => {
        products
          .filter(product => product.isStockLow())
          .forEach(product => this._domainEventBus.publish(new ProductWithLowStock({
            barcode: product.barcode,
            name: product.name,
            stock: product.stock,
            stockMin: product.stockMin
          })));
        return order;
      });
  }

}


