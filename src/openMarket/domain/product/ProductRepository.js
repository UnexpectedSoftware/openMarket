/** @template T @typedef {import('rxjs/Observable').Observable<T>} Observable */
/** @typedef {import('./Product').default} Product */
/** @typedef {import('./ProductFilter').default} ProductFilter */

/**
 * @typedef {object} CatalogQuery
 * @property {string} [query]
 * @property {boolean} [lowStock]
 * @property {string | null} [status] ENABLED, DISABLED, or null for both
 * @property {string | null} [categoryId]
 */

/**
 * @typedef {object} CatalogCursor
 * @property {string} name
 * @property {number | null} stock
 * @property {string} barcode
 */

/**
 * Port for the product collection.
 * Adapters declare `@implements {ProductRepository}`; they do not extend this class.
 * @interface
 */
export default class ProductRepository {
  /**
   * @param {{productFilter: ProductFilter}} query
   * @returns {Observable<Product[]>}
   */
  findAll({ productFilter }) {
    throw new Error('ProductRepository#findAll must be implemented');
  }

  /**
   * @param {{name: string, limit: number, offset: number}} query
   * @returns {Observable<Product[]>}
   */
  findAllByName({ name, limit, offset }) {
    throw new Error('ProductRepository#findAllByName must be implemented');
  }

  /**
   * @param {{limit: number, offset: number}} query
   * @returns {Observable<Product[]>}
   */
  findAllWithLowStock({ limit, offset }) {
    throw new Error('ProductRepository#findAllWithLowStock must be implemented');
  }

  /**
   * One catalog page. sort is name_asc (default), name_desc, stock_asc, or stock_desc.
   * The cursor is the last product's name, stock, and barcode.
   * @param {CatalogQuery & {sort?: string | null, after?: CatalogCursor | null, limit: number}} query
   * @returns {Observable<{products: Product[], hasMore: boolean}>}
   */
  findCatalog({query, lowStock, status, categoryId, sort, after, limit}) {
    throw new Error('ProductRepository#findCatalog must be implemented');
  }

  /**
   * @param {CatalogQuery} query
   * @returns {Observable<number>}
   */
  countCatalog({query, lowStock, status, categoryId}) {
    throw new Error('ProductRepository#countCatalog must be implemented');
  }

  /**
   * @param {{product: Product, imagePath?: string | null}} command
   * @returns {Observable<null>}
   */
  save({ product, imagePath }) {
    throw new Error('ProductRepository#save must be implemented');
  }

  /**
   * Emits the product, or completes empty when the barcode is unknown.
   * @param {{barcode: string}} query
   * @returns {Observable<Product>}
   */
  findByBarcode({ barcode }) {
    throw new Error('ProductRepository#findByBarcode must be implemented');
  }

  /**
   * @returns {Observable<Array<{key: string, value: string}>>}
   */
  findAllStatuses() {
    throw new Error('ProductRepository#findAllStatuses must be implemented');
  }

  /**
   * @returns {Observable<number>}
   */
  countProducts() {
    throw new Error('ProductRepository#countProducts must be implemented');
  }

  /**
   * @param {{name: string}} query
   * @returns {Observable<number>}
   */
  countProductsByName({name}) {
    throw new Error('ProductRepository#countProductsByName must be implemented');
  }

  /**
   * @returns {Observable<number>}
   */
  countProductsWithLowStock() {
    throw new Error('ProductRepository#countProductsWithLowStock must be implemented');
  }

  /**
   * Products with no photo whose barcode can be looked up.
   * @returns {Observable<number>}
   */
  countWithoutImage() {
    throw new Error('ProductRepository#countWithoutImage must be implemented');
  }

  /**
   * One page of products, ordered by barcode. Includes disabled products.
   * @param {{limit: number, offset: number}} query
   * @returns {Observable<Product[]>}
   */
  findPage({limit, offset}) {
    throw new Error('ProductRepository#findPage must be implemented');
  }

  /**
   * @param {{barcode: string, imagePath: string}} command
   * @returns {Observable<null>}
   */
  updateProduct({barcode, imagePath}) {
    throw new Error('ProductRepository#updateProduct must be implemented');
  }
}
