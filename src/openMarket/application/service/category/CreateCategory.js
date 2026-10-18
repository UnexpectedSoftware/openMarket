/** @template T @typedef {import('rxjs/Observable').Observable<T>} Observable */
/** @typedef {import('../../../domain/category/CategoryRepository').default} CategoryRepository */
/** @typedef {import('../../../domain/category/CategoryFactory').default} CategoryFactory */

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
