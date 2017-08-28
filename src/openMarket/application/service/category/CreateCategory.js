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
     * @param {string} imageUrl
     * @returns {*|Observable.<null>}
     */
  createCategory({ name }) {
    return this.repository.save({ name });
  }
}
