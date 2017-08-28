/**
 * @class ListAllProducts
 */
export default class ListAllProducts {

    /**
     * @constructs ListAllProducts
     * @param {ProductRepository} repository
     * @param {ProductFilterFactory} productFilterFactory
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
     *
     * @param {number} limit
     * @param {number} offset
     * @returns {Observable.<Array.<Product>>}
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
     *
     * @param {string} name
     * @param {number} limit
     * @param {number} offset
     * @returns {*|Observable.<Product>}
     */
  findAllByName({ name, limit, offset }) {
    return this._productRepository.findAllByName({
      name,
      limit,
      offset
    });
  }

  findAllWithLowStock({ limit, offset }){
    return this._productRepository.findAllWithLowStock({
        limit,
        offset
    });
  }

  findAllStatuses(){
    return this._productRepository.findAllStatuses();
  }

}
