/**
 * Downloads one product photo for a barcode.
 * The catalog fetch uses the same product image source, one product at a time.
 */
export default class FindProductImage {
  constructor({productImageSource}) {
    this._productImageSource = productImageSource;
  }

  /**
   * @param {string} barcode
   * @returns {Observable<?string>} absolute path of a downloaded image, or null
   */
  findByBarcode({barcode}) {
    return this._productImageSource.findByBarcode({barcode});
  }
}
