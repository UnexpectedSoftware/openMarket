/** @template T @typedef {import('rxjs/Observable').Observable<T>} Observable */
/** @typedef {import('../../../domain/category/Category').default} Category */
/** @typedef {import('../../../domain/category/CategoryRepository').default} CategoryRepository */

/**
 * @class FindCategoryById
 */
export default class FindCategoryById {

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
     * @param {{id: string}} query
     * @returns {Observable<Category>}
     */
  findById({ id }) {
    return this.repository.findById({ id });
  }

}
