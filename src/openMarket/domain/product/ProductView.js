import {marginPercent} from './margin';

/**
 * A product as stored, for a screen to read. It carries the row's data and the
 * two display facts (margin, low stock) and does not check sale rules: a row
 * already in the database was valid when it was saved. The write aggregate is `Product`.
 */
export default class ProductView {

  /**
   * @param {{barcode?: string, name?: string, categoryId?: string | null, categoryName?: string | null, priceCents?: number, basePriceCents?: number, vat?: {kind?: string, percent?: number, cause?: string | null} | null, stock?: number | null, stockMin?: number | null, weighted?: boolean, status?: string | null, imageUrl?: string | null}} [props]
   */
  constructor({
    barcode,
    name,
    categoryId,
    categoryName,
    priceCents,
    basePriceCents,
    vat,
    stock,
    stockMin,
    weighted,
    status,
    imageUrl
  } = {}) {
    this.barcode = barcode;
    this.name = name;
    this.categoryId = categoryId;
    this.categoryName = categoryName;
    this.priceCents = priceCents;
    this.basePriceCents = basePriceCents;
    this.marginPercent = marginPercent({priceCents, baseCents: basePriceCents});
    this.vat = copyVat(vat);
    this.stock = stock;
    this.stockMin = stockMin;
    this.weighted = !!weighted;
    this.status = status;
    this.lowStock = isLowStock(stock, stockMin);
    this.imageUrl = imageUrl == null ? null : imageUrl;
    Object.freeze(this);
  }

}

/**
 * Missing stock or a missing minimum is not low. Otherwise stock at or under the minimum is low.
 * @param {number | null | undefined} stock
 * @param {number | null | undefined} stockMin
 * @returns {boolean}
 */
function isLowStock(stock, stockMin) {
  if (stock == null || stockMin == null) {
    return false;
  }
  return stock <= stockMin;
}

/**
 * @param {{kind?: string, percent?: number, cause?: string | null} | null | undefined} vat
 * @returns {{kind: string | undefined, percent: number | undefined, cause: string | null | undefined} | null}
 */
function copyVat(vat) {
  if (vat == null) {
    return null;
  }
  return Object.freeze({
    kind: vat.kind,
    percent: vat.percent,
    cause: vat.cause
  });
}
