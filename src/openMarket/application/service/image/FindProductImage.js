import 'rxjs/add/operator/map';
/** @template T @typedef {import('rxjs/Observable').Observable<T>} Observable */
/** @typedef {import('../../../domain/image/ProductImageSource').default} ProductImageSource */

/**
 * Downloads one product photo for a barcode.
 * The catalog fetch uses the same product image source, one product at a time.
 */
export default class FindProductImage {
  /**
   * @param {{productImageSource: ProductImageSource, readDataUrl?: (filePath: string) => (string | null)}} deps
   */
  constructor({productImageSource, readDataUrl}) {
    this._productImageSource = productImageSource;
    this._readDataUrl = readDataUrl || null;
  }

  /**
   * @param {{barcode: string}} query
   * @returns {Observable<{imagePath: string, imageUrl: string | null} | null>}
   */
  findByBarcode({barcode}) {
    return this._productImageSource.findByBarcode({barcode}).map(imagePath => {
      if (!imagePath) {
        return null;
      }
      const imageUrl = this._readDataUrl ? this._readDataUrl(imagePath) : null;
      return {imagePath, imageUrl};
    });
  }
}
