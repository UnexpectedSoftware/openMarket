/** @import { Observable } from 'rxjs/Observable' */

/**
 * One product tile on the sell screen. A read model, not a Product.
 * @typedef {object} SaleTile
 * @property {string} barcode
 * @property {string} name
 * @property {number} priceCents
 * @property {{kind: string, percent: number, cause: string | null}} vatRate
 * @property {boolean} weighted
 * @property {boolean} lowStock
 * @property {string | null} [imageUrl]
 */

/**
 * Port: products the cashier can put on a ticket, as plain tiles.
 * @interface
 */
export default class ProductsQuery {

  /**
   * Enabled products, optionally filtered by name or barcode and by category.
   * Completes with an array. It does not load Product aggregates.
   * @param {{text?: string, categoryId?: string, limit?: number}} [query]
   * @returns {Observable<SaleTile[]>}
   */
  listForSale({text, categoryId, limit} = {}) {
    throw new Error('ProductsQuery#listForSale must be implemented');
  }

}
