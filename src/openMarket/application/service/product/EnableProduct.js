import * as Rx from "rxjs";
import "rxjs/add/operator/defaultIfEmpty";
import ProductEnabledAgain from "../../../domain/event/ProductEnabledAgain";
import ProductNotFoundError from "../../../domain/product/ProductNotFoundError";
import observableError from "../../../infrastructure/logging/observableError";

/**
 * Puts a disabled product back on sale when a cashier scans it.
 */
export default class EnableProduct {
  /**
   * @param {ProductRepository} repository
   * @param {DomainEventBus} domainEventBus
   */
  constructor({ repository, domainEventBus }) {
    /**
     * @type {ProductRepository}
     * @private
     */
    this._productRepository = repository;
    /**
     * @type {DomainEventBus}
     * @private
     */
    this._domainEventBus = domainEventBus;
  }

  /**
   * Enable a disabled product and add one unit. An enabled product is unchanged.
   * @param {string} barcode
   * @returns {Observable<Product>}
   */
  enableForSale({ barcode }) {
    return this._productRepository.findByBarcode({ barcode })
      .defaultIfEmpty(null)
      .flatMap(product => {
        if (!product) {
          return observableError(new ProductNotFoundError({barcode, operation: 'enable'}));
        }
        if (!product.isDisabled()) {
          return Rx.Observable.of(product);
        }
        product.enable();
        product.addStock({ quantity: 1 });
        return this._productRepository.save({ product })
          .map(() => {
            this._domainEventBus.publish(new ProductEnabledAgain({
              barcode: product.barcode,
              name: product.name
            }));
            return product;
          });
      });
  }

}
