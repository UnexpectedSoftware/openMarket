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
     * @returns {Observable.<null>}
     */
  updateCategory({ id, name }) {
    return this.repository.update({
      id,
      name
    });
  }

  /**
   * @param {string} id
   * @param {string} imagePath absolute path of a file to copy
   * @returns {Observable.<null>}
   */
  replaceImage({id, imagePath}) {
    return this.repository.updateCategory({id, imagePath});
  }

  /**
   * @param {string} id
   * @returns {Observable.<null>}
   */
  removeImage({id}) {
    return this.repository.clearImage({id});
  }
}
