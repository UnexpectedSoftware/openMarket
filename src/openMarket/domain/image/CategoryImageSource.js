/**
 * @interface
 */
export default class CategoryImageSource {
  /**
   * @param {string} name
   * @returns {Observable<?string>} absolute path of a downloaded image, or null
   */
  findByName({name}) {
    throw new Error('CategoryImageSource#findByName must be implemented');
  }
}
