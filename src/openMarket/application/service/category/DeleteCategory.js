/** @template T @typedef {import('rxjs/Observable').Observable<T>} Observable */
/** @typedef {import('../../../domain/category/CategoryRepository').default} CategoryRepository */

/**
 * @class DeleteCategory
 */
export default class DeleteCategory {
    /**
     * @param {{repository: CategoryRepository}} deps
     */
  constructor({ repository }) {
        /**
         * @type {CategoryRepository}
         * @private
         */
    this.repository = repository;
  }

    /**
     * Removes a category that has no products.
     * @param {{id: string}} command
     * @returns {Observable<null>}
     */
  deleteCategory({ id }) {
    return this.repository.remove({ id });
  }
}
