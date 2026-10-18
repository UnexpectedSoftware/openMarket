/** @template T @typedef {import('rxjs/Observable').Observable<T>} Observable */
/** @typedef {import('../../../domain/category/CategoryRepository').default} CategoryRepository */
/** @typedef {import('../../../domain/category/CategorySummary').default} CategorySummary */

/**
 * @class ListAllCategories
 */
export default class ListAllCategories {

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
     * @returns {Observable<CategorySummary[]>}
     */
  findAllWithStats() {
    return this.repository.findAllWithStats();
  }
}
