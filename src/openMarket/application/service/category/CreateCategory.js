/**
 * @class CreateCategory
 */
export default class CreateCategory {
    /**
     * @constructs CreateCategory
     * @param {CategoryRepository} repository
     */
  constructor({ repository }) {
        /**
         * @type CategoryRepository
         * @member CreateCategory#repository
         */
    this.repository = repository;
  }

    /**
     *
     * @param {string} name
     * @param {?string} imagePath absolute path of a file to copy, when the user picked one
     * @returns {*|Observable.<null>}
     */
  createCategory({ name, imagePath }) {
    return this.repository.save({ name, imagePath });
  }
}
