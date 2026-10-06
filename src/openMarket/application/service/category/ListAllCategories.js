/**
 * @class ListAllCategories
 */
export default class ListAllCategories {

    /**
     * @constructs ListAllCategories
     * @param {CategoryRepository} repository
     */
  constructor({ repository }) {
        /**
         * @type {CategoryRepository}
         * @member ListAllCategories#repository
         * */
    this.repository = repository;
  }

    /**
     *
     * @returns {Observable.<Array.<CategorySummary>>}
     */
  findAllWithStats() {
    return this.repository.findAllWithStats();
  }
}
