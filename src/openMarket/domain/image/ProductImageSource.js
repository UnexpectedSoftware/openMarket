/**
 * @interface
 */
export default class ProductImageSource {
  /**
   * @param {string} barcode
   * @returns {Observable<?string>} absolute path of a downloaded image, or null
   */
  findByBarcode({barcode}) {
    throw new Error('ProductImageSource#findByBarcode must be implemented');
  }
}
