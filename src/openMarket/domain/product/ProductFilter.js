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
     * @param {object} [params]
     * @param {number} [params.limit]
     * @param {number} [params.offset]
     * @param {Record<string, string>} [params.sort]
     * @param {string} [params.status]
     */
  constructor({ limit = defaultLimit, offset = defaultOffset, sort = defaultSorting, status = defaultStatus } = {}) {
        /**
         * @private
         * @type {number}
         */
    this._limit = limit;
        /**
         * @private
         * @type {number}
         */
    this._offset = offset;
        /**
         * @private
         * @type {Record<string, string>}
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
     * @returns {number}
     */
  get limit() {
    return this._limit;
  }

    /**
     * @returns {number}
     */
  get offset() {
    return this._offset;
  }

    /**
     * @returns {Record<string, string>}
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
