/** @template T @typedef {import('rxjs/Observable').Observable<T>} Observable */

/**
 * Port: finds a category photo for a name.
 * Adapters declare `@implements {CategoryImageSource}`; they do not extend this class.
 * @interface
 */
export default class CategoryImageSource {
  /**
   * @param {{name: string}} query
   * @returns {Observable<string | null>} absolute path of a downloaded image, or null
   */
  findByName({name}) {
    throw new Error('CategoryImageSource#findByName must be implemented');
  }
}
