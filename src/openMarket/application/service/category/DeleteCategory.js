/**
 * @class DeleteCategory
 */
export default class DeleteCategory {
    /**
     * @constructs DeleteCategory
     * @param {CategoryRepository} repository
     */
  constructor({ repository }) {
        /**
         * @type {CategoryRepository}
         * @member DeleteCategory#repository
         */
    this.repository = repository;
  }

    /**
     * Removes a category that has no products.
     * @param {string} id
     * @returns {Observable.<null>}
     */
  deleteCategory({ id }) {
    return this.repository.remove({ id });
  }
}
