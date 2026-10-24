/** @template T @typedef {import('rxjs/Observable').Observable<T>} Observable */
/** @typedef {import('../../../domain/category/CategoryRepository').default} CategoryRepository */
/** @typedef {import('../../../domain/category/CategorySummary').default} CategorySummary */
/** @typedef {import('../../../domain/category/CategoriesQuery').default} CategoriesQuery */
/** @typedef {import('../../../domain/category/CategoryView').default} CategoryView */

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

    /**
     * Forwards CategoryRepository.find. The rows are CategoryView read models.
     * @param {CategoriesQuery} query
     * @returns {Observable<{items: CategoryView[], total: number}>}
     */
  list(query) {
    return this.repository.find(query);
  }
}
