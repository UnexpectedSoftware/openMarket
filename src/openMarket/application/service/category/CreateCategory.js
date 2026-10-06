/**
 * @class CreateCategory
 */
export default class CreateCategory {
    /**
     * @constructs CreateCategory
     * @param {CategoryRepository} repository
     * @param {CategoryFactory} categoryFactory
     */
  constructor({ repository, categoryFactory }) {
        /**
         * @type CategoryRepository
         * @member CreateCategory#repository
         */
    this.repository = repository;
        /**
         * @type CategoryFactory
         * @member CreateCategory#categoryFactory
         */
    this.categoryFactory = categoryFactory;
  }

    /**
     *
     * @param {string} name
     * @param {?string} imagePath absolute path of a file to copy, when the user picked one
     * @returns {*|Observable.<null>}
     */
  createCategory({ name, imagePath }) {
    const category = this.categoryFactory.createWith({ name });
    return this.repository.save({ category, imagePath });
  }
}
