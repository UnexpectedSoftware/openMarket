import {Observable} from "rxjs/Observable";
/**
 * @class CreateOrder
 */
export default class CreateOrder {

  /**
   *
   * @param {OrderRepository} orderRepository
   * @param {ProductRepository} productRepository
   */
  constructor({ orderRepository, productRepository }) {
    this._orderRepository = orderRepository;
    this._productRepository = productRepository;
  }

  /**
   * Create a new Order with all lines
   * @param lines
   * @returns {Observable.<null>}
   */
  createOrder({lines}) {
    return this._orderRepository.save({ lines })
      .flatMap(savedOrder => Observable.from(lines))
      .flatMap(line =>
        this._productRepository.findByBarcode({barcode: line.barcode})
          .map(product => product.subtractStock({quantity: line.quantity}))
          .flatMap(product => this._productRepository.save({product}))
      );
  }

}
