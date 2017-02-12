import ProductStatus from "./ProductStatus";

const defaultLimit = 10;
const defaultOffset = 0;
const defaultSorting = { name: 'ASC' };
const defaultStatus = ProductStatus.ENABLED;
/**
 * @class ProductFilter
 */
export default class ProductFilter {
    /**
     * @constructs ProductFilter
     * @param {number} limit
     * @param {number} offset
     * @param {Object} sort
     * @param {string} status
     */
  constructor({ limit = defaultLimit, offset = defaultOffset, sort = defaultSorting, status = defaultStatus } = {}) {
        /**
         * @private
         * @type {number}
         * @member ProductFilter#_limit
         */
    this._limit = limit;
        /**
         * @private
         * @type {number}
         * @member ProductFilter#_offset
         */
    this._offset = offset;
        /**
         * @private
         * @type {Object}
         * @member ProductFilter#_sorting
         */
    this._sorting = sort;
      /**
       *
       * @type {string}
       * @private
       */
    this._status = status;

  }

    /**
     *
     * @returns {ProductFilter#_limit}
     */
  get limit() {
    return this._limit;
  }

    /**
     *
     * @returns {ProductFilter#_offset}
     */
  get offset() {
    return this._offset;
  }

    /**
     *
     * @returns {ProductFilter#_sorting}
     */
  get sorting() {
    return this._sorting;
  }

  /**
   *
   * @returns {string}
   */
  get status() {
    return this._status;
  }


}
