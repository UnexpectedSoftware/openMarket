/**
 * @class CreateOrUpdateProduct
 */
import "rxjs/add/operator/defaultIfEmpty";
import "rxjs/add/operator/do";
import "rxjs/add/operator/map";
import "rxjs/add/operator/mergeMap";
import VatRate from "../../../domain/tax/VatRate";
import ProductCreated from "../../../domain/event/ProductCreated";
/** @template T @typedef {import('rxjs/Observable').Observable<T>} Observable */
/** @typedef {import('../../../domain/category/CategoryRepository').default} CategoryRepository */
/** @typedef {import('../../../domain/product/ProductFactory').default} ProductFactory */
/** @typedef {import('../../../domain/product/ProductRepository').default} ProductRepository */
/** @typedef {import('../../../domain/product/Product').default} Product */
/** @typedef {import('../../../domain/service/DomainEventBus').default} DomainEventBus */
/** @typedef {import('../../../domain/service/Transaction').default} Transaction */

export default class CreateOrUpdateProduct {
  /**
   * Create use case
   * @param {object} deps
   * @param {ProductRepository} deps.productRepository
   * @param {ProductFactory} deps.productFactory
   * @param {CategoryRepository} deps.categoryRepository
   * @param {DomainEventBus} deps.domainEventBus
   * @param {Transaction} deps.transaction
   */
  constructor({ productRepository, productFactory, categoryRepository, domainEventBus, transaction }) {
    /**
     *
     * @type {ProductRepository}
     * @private
     */
    this._productRepository = productRepository;
    /**
     *
     * @type {ProductFactory}
     * @private
     */
    this._productFactory = productFactory;
    /**
     * @type {CategoryRepository}
     * @private
     */
    this._categoryRepository = categoryRepository;
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
   * Create or update a product
   * @param {object} product
   * @param {string} product.barcode
   * @param {string} product.name
   * @param {string} product.description
   * @param {number} product.price
   * @param {number} product.basePrice
   * @param {number} product.stock
   * @param {number} product.stockMin
   * @param {boolean} product.weighted
   * @param {string} product.categoryId
   * @param {string} product.status
   * @param {string | VatRate | object | null} [product.vatRate]
   * @param {string | null} [product.imagePath] absolute path of a file to copy, when the user picked one
   * @returns {Observable<null>}
   */
  createOrUpdate({ barcode, name, description, price, basePrice, stock, stockMin, weighted, categoryId, status, vatRate, imagePath }) {
    return this._transaction.run(() => this._productRepository.findByBarcode({barcode})
      .defaultIfEmpty(null)
      .flatMap(existing => this._categoryRepository.findById({id: categoryId})
        .map(category => this._productFactory.createWith({
          barcode,
          name,
          description,
          price,
          basePrice,
          stock,
          stockMin,
          weighted,
          category,
          status,
          vatRate: vatRate == null || vatRate === '' ? VatRate.standard() : VatRate.from(vatRate)
        }))
        .flatMap(product => this._store({product, imagePath, existing}))))
      .do(
        () => this._domainEventBus.raise(),
        () => this._domainEventBus.discard()
      );
  }

  /**
   * @param {{product: Product, imagePath?: string | null, existing: Product | null}} saved
   * @returns {Observable<null>}
   * @private
   */
  _store({product, imagePath, existing}) {
    return this._productRepository.save({product, imagePath}).do(() => {
      if (existing) {
        return;
      }
      this._domainEventBus.save(new ProductCreated({barcode: product.barcode, name: product.name}));
    });
  }
}
