/**
 * A category as stored, for a screen to read. It carries the row's totals and
 * does not check rename or delete rules: a row already in the database was
 * valid when it was saved. The write aggregate is `Category`.
 * Money is integer cents. There is no euro float and no image filename.
 */
export default class CategoryView {

  /**
   * @param {{id?: string, name?: string, imageUrl?: string | null, productCount?: number, stockTotal?: number, basePriceCents?: number, mostSold?: {barcode: string, name: string, quantity: number} | null}} [props]
   */
  constructor({id, name, imageUrl, productCount, stockTotal, basePriceCents, mostSold} = {}) {
    this.id = id;
    this.name = name;
    this.imageUrl = imageUrl == null ? null : imageUrl;
    this.productCount = productCount;
    this.stockTotal = stockTotal;
    this.basePriceCents = basePriceCents;
    this.mostSold = copyMostSold(mostSold);
    Object.freeze(this);
  }

}

/**
 * @param {{barcode: string, name: string, quantity: number} | null | undefined} mostSold
 * @returns {{barcode: string, name: string, quantity: number} | null}
 */
function copyMostSold(mostSold) {
  if (mostSold == null) {
    return null;
  }
  return Object.freeze({
    barcode: mostSold.barcode,
    name: mostSold.name,
    quantity: mostSold.quantity
  });
}
