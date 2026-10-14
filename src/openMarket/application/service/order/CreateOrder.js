import {Observable} from "rxjs/Observable";
import {record} from "../../../infrastructure/logging/ErrorLog";
import "rxjs/add/operator/do";
import "rxjs/add/operator/map";
import "rxjs/add/operator/toArray";
import OrderCreated from "../../../domain/event/OrderCreated";
import ProductWithLowStock from "../../../domain/event/ProductWithLowStock";
/** @import Order from "../../../domain/order/Order" */
/** @import { OrderLine } from "../../../domain/order/Order" */
/** @import OrderFactory from "../../../domain/order/OrderFactory" */
/** @import OrderRepository from "../../../domain/order/OrderRepository" */
/** @import ProductRepository from "../../../domain/product/ProductRepository" */
/** @import DomainEventBus from "../../../domain/service/DomainEventBus" */
/** @import Transaction from "../../../domain/service/Transaction" */

/**
 * @class CreateOrder
 */
export default class CreateOrder {

  /**
   * @param {object} deps
   * @param {OrderRepository} deps.orderRepository
   * @param {ProductRepository} deps.productRepository
   * @param {OrderFactory} deps.orderFactory
   * @param {DomainEventBus} deps.domainEventBus
   * @param {Transaction} deps.transaction
   * @param {{dispatch: () => void}} deps.domainEventDispatcher
   */
  constructor({ orderRepository, productRepository, orderFactory, domainEventBus, transaction, domainEventDispatcher}) {
    this._orderRepository = orderRepository;
    this._productRepository = productRepository;
    this._orderFactory = orderFactory;
    this._domainEventBus = domainEventBus;
    this._transaction = transaction;
    this._domainEventDispatcher = domainEventDispatcher;
  }

  /**
   * Create a new Order with all lines
   * @param {{lines: OrderLine[]}} order
   * @returns {Observable<Order>}
   */
  createOrder({lines}) {
    return this._transaction.run(() => this._buildOrder({lines})
      .flatMap(order => this._orderRepository.save({order})
        .flatMap(saved => this._subtrackStock({order: saved})))
      .do(({order, lowStockProducts}) => {
        this._domainEventBus.save(new OrderCreated({
          id: order.id,
          createdAt: order.createdAt,
          lines: order.lines
        }));
        lowStockProducts.forEach(product => {
          this._domainEventBus.record(new ProductWithLowStock({
            barcode: product.barcode,
            name: product.name,
            stock: product.stock,
            stockMin: product.stockMin
          }));
        });
      })
      .map(({order}) => order))
      .do(
        () => {
          this._domainEventBus.raise();
          this._domainEventDispatcher.dispatch();
        },
        () => this._domainEventBus.discard()
      );
  }

  _buildOrder({lines})  {
    return Observable.create(observer => {
      try {
        const order = this._orderFactory.createWith({lines});
        observer.next(order);
      } catch (error) {
        observer.error(record(error));
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


