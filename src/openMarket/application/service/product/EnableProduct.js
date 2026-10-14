import * as Rx from "rxjs";
import "rxjs/add/operator/defaultIfEmpty";
import "rxjs/add/operator/do";
import ProductEnabledAgain from "../../../domain/event/ProductEnabledAgain";
import ProductNotFoundError from "../../../domain/product/ProductNotFoundError";
import observableError from "../../../infrastructure/logging/observableError";
/** @import { Observable } from 'rxjs/Observable' */
/** @import Product from '../../../domain/product/Product' */
/** @import ProductRepository from '../../../domain/product/ProductRepository' */
/** @import DomainEventBus from '../../../domain/service/DomainEventBus' */
/** @import Transaction from '../../../domain/service/Transaction' */

/**
 * Puts a disabled product back on sale when a cashier scans it.
 */
export default class EnableProduct {
  /**
   * @param {object} deps
   * @param {ProductRepository} deps.repository
   * @param {DomainEventBus} deps.domainEventBus
   * @param {Transaction} deps.transaction
   */
  constructor({ repository, domainEventBus, transaction }) {
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
    /**
     * @type {Transaction}
     * @private
     */
    this._transaction = transaction;
  }

  /**
   * Enable a disabled product and add one unit. An enabled product is unchanged.
   * @param {{barcode: string}} command
   * @returns {Observable<Product>}
   */
  enableForSale({ barcode }) {
    return this._transaction.run(() => this._productRepository.findByBarcode({ barcode })
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
          .do(() => {
            this._domainEventBus.record(new ProductEnabledAgain({
              barcode: product.barcode,
              name: product.name
            }));
          })
          .map(() => product);
      }))
      .do(
        () => this._domainEventBus.raise(),
        () => this._domainEventBus.discard()
      );
  }

}
