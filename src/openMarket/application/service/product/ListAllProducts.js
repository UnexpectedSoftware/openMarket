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
    this._repository = repository;
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
    return this._repository.findAll({
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
    return this._repository.findAllByName({
      name,
      limit,
      offset
    });
  }

  findAllWithLowStock({ limit, offset }){
    return this._repository.findAllWithLowStock({
        limit,
        offset
    });
  }


}
