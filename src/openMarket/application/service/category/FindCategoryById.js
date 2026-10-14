/** @import { Observable } from 'rxjs/Observable' */
/** @import Category from '../../../domain/category/Category' */
/** @import CategoryRepository from '../../../domain/category/CategoryRepository' */

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
