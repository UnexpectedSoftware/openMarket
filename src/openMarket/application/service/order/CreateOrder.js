import {Observable} from "rxjs/Observable";

/**
 * @class CreateOrder
 */
export default class CreateOrder {

  /**
   *
   * @param {OrderRepository} orderRepository
   * @param {ProductRepository} productRepository
   * @param {OrderFactory} orderFactory
   */
  constructor({ orderRepository, productRepository, orderFactory}) {
    this._orderRepository = orderRepository;
    this._productRepository = productRepository;
    this._orderFactory = orderFactory;
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
        .flatMap(product => this._productRepository.save({product}))
      )
      .last()
      .map(data => order);
  }

}


