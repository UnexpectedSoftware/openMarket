/** @template T @typedef {import('rxjs/Observable').Observable<T>} Observable */
/** @typedef {import('../../../domain/product/Product').default} Product */
/** @typedef {import('../../../domain/product/ProductFilterFactory').default} ProductFilterFactory */
/** @typedef {import('../../../domain/product/ProductRepository').default} ProductRepository */
/** @typedef {import('../../../domain/product/ProductRepository').CatalogCursor} CatalogCursor */
/** @typedef {import('../../../domain/product/ProductRepository').CatalogQuery} CatalogQuery */
/** @typedef {import('../../../domain/product/ProductsQuery').default} ProductsQuery */
/** @typedef {import('../../../domain/product/ProductView').default} ProductView */

/**
 * @class ListAllProducts
 */
export default class ListAllProducts {

    /**
     * @param {{repository: ProductRepository, productFilterFactory: ProductFilterFactory}} deps
     */
  constructor({ repository, productFilterFactory }) {
      /**
       *
        * @type {ProductRepository}
       * @private
       */
    this._productRepository = repository;
      /**
       *
        * @type {ProductFilterFactory}
       * @private
       */
    this._productFilterFactory = productFilterFactory;
  }

    /**
     * @param {{limit: number, offset: number}} page
     * @returns {Observable<Product[]>}
     */
  findAll({ limit, offset }) {
    return this._productRepository.findAll({
      productFilter: this._productFilterFactory.createWith({
        limit,
        offset
      })
    });
  }

    /**
     * @param {{name: string, limit: number, offset: number}} query
     * @returns {Observable<Product[]>}
     */
  findAllByName({ name, limit, offset }) {
    return this._productRepository.findAllByName({
      name,
      limit,
      offset
    });
  }

  /**
   * @param {{limit: number, offset: number}} page
   * @returns {Observable<Product[]>}
   */
  findAllWithLowStock({ limit, offset }){
    return this._productRepository.findAllWithLowStock({
        limit,
        offset
    });
  }

  /**
   * sort is name_asc (default), name_desc, stock_asc, or stock_desc.
   * @param {CatalogQuery & {sort?: string | null, after?: CatalogCursor | null, limit: number}} query
   * @returns {Observable<{products: Product[], hasMore: boolean}>}
   */
  findCatalog({query, lowStock, status, categoryId, sort, after, limit}) {
    return this._productRepository.findCatalog({
      query,
      lowStock,
      status,
      categoryId,
      sort,
      after,
      limit
    });
  }

  /**
   * Forwards ProductRepository.find. The rows are ProductView read models.
   * @param {ProductsQuery} query
   * @returns {Observable<{items: ProductView[], total: number}>}
   */
  list(query) {
    return this._productRepository.find(query);
  }

  /**
   * @returns {Observable<Array<{key: string, value: string}>>}
   */
  findAllStatuses(){
    return this._productRepository.findAllStatuses();
  }

}
