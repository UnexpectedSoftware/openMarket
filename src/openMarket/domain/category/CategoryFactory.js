/** @typedef {import('./Category').default} Category */

/**
 * Port for building a category.
 * Adapters declare `@implements {CategoryFactory}`; they do not extend this class.
 * @interface
 */
export default class CategoryFactory {

  /**
   * @param {{name: string, imageName?: string | null}} category
   * @returns {Category}
   */
  createWith({ name, imageName }) {
    throw new Error('CategoryFactory#createWith must be implemented');
  }

  /**
   * @param {{id: string, name: string, imageName?: string | null}} category
   * @returns {Category}
   */
  createWithId({ id, name, imageName }) {
    throw new Error('CategoryFactory#createWithId must be implemented');
  }

}
