/**
 * @interface
 * */
export default class CategoryRepository {

  findAll() {
    throw new Error('CategoryRepository#category must be implemented');
  }

    /**
     *
     * @param {string} id
     */
  findById({ id }) {
    throw new Error('CategoryRepository#category must be implemented');
  }

    /**
     *
     * @param {string} name
     * @param {?string} imagePath absolute path of a file to copy, when the user picked one
     */
  save({ name, imagePath }) {
    throw new Error('CategoryRepository#category must be implemented');
  }

    /**
     *
     * @param {string} id
     * @param {string} name
     */
  update({ id, name }) {
    throw new Error('CategoryRepository#category must be implemented');
  }

  /**
   * @param {string} id
   * @param {string} imagePath absolute path of a file to copy
   * @returns {Observable<null>}
   */
  updateCategory({id, imagePath}) {
    throw new Error('CategoryRepository#updateCategory must be implemented');
  }
}
