/**
 * Criteria for one product read model. A value passed to
 * `ProductRepository.findDetail`. It is not a port, and it does not check the barcode.
 */
export default class ProductDetailQuery {

  /**
   * @param {{barcode?: string | null}} [props]
   */
  constructor({barcode} = {}) {
    this.barcode = barcode == null ? null : String(barcode);
    Object.freeze(this);
  }

}
