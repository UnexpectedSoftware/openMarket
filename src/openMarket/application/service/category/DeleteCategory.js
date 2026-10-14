/** @import { Observable } from 'rxjs/Observable' */
/** @import CategoryRepository from '../../../domain/category/CategoryRepository' */

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
