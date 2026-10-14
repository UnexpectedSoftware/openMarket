/** @import { Observable } from 'rxjs/Observable' */
/** @import CategoryRepository from '../../../domain/category/CategoryRepository' */
/** @import CategoryFactory from '../../../domain/category/CategoryFactory' */

/**
 * @class CreateCategory
 */
export default class CreateCategory {
    /**
     * @param {{repository: CategoryRepository, categoryFactory: CategoryFactory}} deps
     */
  constructor({ repository, categoryFactory }) {
        /**
         * @type {CategoryRepository}
         * @private
         */
    this.repository = repository;
        /**
         * @type {CategoryFactory}
         * @private
         */
    this.categoryFactory = categoryFactory;
  }

    /**
     * @param {object} category
     * @param {string} category.name
     * @param {string | null} [category.imagePath] absolute path of a file to copy, when the user picked one
     * @returns {Observable<null>}
     */
  createCategory({ name, imagePath }) {
    const category = this.categoryFactory.createWith({ name });
    return this.repository.save({ category, imagePath });
  }
}
