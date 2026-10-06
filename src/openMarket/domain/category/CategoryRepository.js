/**
 * @interface
 * */
export default class CategoryRepository {

  findAll() {
    throw new Error('CategoryRepository#category must be implemented');
  }

  /**
   * Every category with product totals and its most sold product.
   * @returns {Observable.<Array.<CategorySummary>>}
   */
  findAllWithStats() {
    throw new Error('CategoryRepository#findAllWithStats must be implemented');
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

  /**
   * Drop the stored photo and leave the category on the default image.
   * @param {string} id
   * @returns {Observable<null>}
   */
  clearImage({id}) {
    throw new Error('CategoryRepository#clearImage must be implemented');
  }

  /**
   * Delete a category that has no products, and its stored image.
   * @param {string} id
   * @returns {Observable.<null>}
   */
  remove({id}) {
    throw new Error('CategoryRepository#remove must be implemented');
  }
}
