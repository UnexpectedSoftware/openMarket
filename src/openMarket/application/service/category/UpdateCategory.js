/** @template T @typedef {import('rxjs/Observable').Observable<T>} Observable */
/** @typedef {import('../../../domain/category/CategoryRepository').default} CategoryRepository */

/**
 * @class UpdateCategory
 */
export default class UpdateCategory {
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
     * @param {{id: string, name: string}} command
     * @returns {Observable<null>}
     */
  updateCategory({ id, name }) {
    return this.repository.update({
      id,
      name
    });
  }

  /**
   * @param {object} command
   * @param {string} command.id
   * @param {string} command.imagePath absolute path of a file to copy
   * @returns {Observable<null>}
   */
  replaceImage({id, imagePath}) {
    return this.repository.updateCategory({id, imagePath});
  }

  /**
   * @param {{id: string}} command
   * @returns {Observable<null>}
   */
  removeImage({id}) {
    return this.repository.clearImage({id});
  }
}
