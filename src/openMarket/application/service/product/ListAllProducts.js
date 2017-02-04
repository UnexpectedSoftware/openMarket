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
         * @type ProductRepository
         * @member ListAllProducts#repository
         */
    this.repository = repository;
        /**
         * @type ProductFilterFactory
         * @member ListAllProducts#productFilterFactory
         */
    this.productFilterFactory = productFilterFactory;
  }

    /**
     *
     * @param {number} limit
     * @param {number} offset
     * @returns {Observable.<Array.<Category>>}
     */
  findAll({ limit, offset }) {
    return this.repository.findAll({
      productFilter: this.productFilterFactory.createWith({
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
    return this.repository.findAllByName({
      name,
      limit,
      offset
    });
  }


}
