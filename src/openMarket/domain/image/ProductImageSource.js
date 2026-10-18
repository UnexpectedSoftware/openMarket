/** @template T @typedef {import('rxjs/Observable').Observable<T>} Observable */

/**
 * Port: finds a product photo for a barcode.
 * Adapters declare `@implements {ProductImageSource}`; they do not extend this class.
 * @interface
 */
export default class ProductImageSource {
  /**
   * @param {{barcode: string}} query
   * @returns {Observable<string | null>} absolute path of a downloaded image, or null
   */
  findByBarcode({barcode}) {
    throw new Error('ProductImageSource#findByBarcode must be implemented');
  }
}
