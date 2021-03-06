/**
 * @class UpdateCategory
 */
export default class UpdateCategory {
    /**
     * @constructs UpdateCategory
     * @param {CategoryRepository} repository
     */
  constructor({ repository }) {
        /**
         * @type {CategoryRepository}
         * @member UpdateCategory#repository
         */
    this.repository = repository;
  }

    /**
     *
     * @param {string} id
     * @param {string} name
     * @param {string} imageUrl
     * @returns {Observable.<null>}
     */
  updateCategory({ id, name }) {
    return this.repository.update({
      id,
      name
    });
  }
}
