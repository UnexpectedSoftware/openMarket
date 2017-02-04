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
     * @returns {Observable.<Array.<Category>>}
     */
  findAll() {
    return this.repository.findAll();
  }
}
