/** @import { Observable } from 'rxjs/Observable' */
/** @import CategoryRepository from '../../../domain/category/CategoryRepository' */
/** @import CategorySummary from '../../../domain/category/CategorySummary' */

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
