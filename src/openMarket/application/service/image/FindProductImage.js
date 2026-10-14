/** @import { Observable } from 'rxjs/Observable' */
/** @import ProductImageSource from '../../../domain/image/ProductImageSource' */

/**
 * Downloads one product photo for a barcode.
 * The catalog fetch uses the same product image source, one product at a time.
 */
export default class FindProductImage {
  /**
   * @param {{productImageSource: ProductImageSource}} deps
   */
  constructor({productImageSource}) {
    this._productImageSource = productImageSource;
  }

  /**
   * @param {{barcode: string}} query
   * @returns {Observable<string | null>} absolute path of a downloaded image, or null
   */
  findByBarcode({barcode}) {
    return this._productImageSource.findByBarcode({barcode});
  }
}
