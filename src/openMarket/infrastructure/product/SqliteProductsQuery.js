import * as Rx from 'rxjs';
import ProductStatus from '../../domain/product/ProductStatus';
import {moneyFromColumns} from '../service/storedMoney';
/** @import { Observable } from 'rxjs/Observable' */
/** @import ProductsQuery from '../../domain/product/ProductsQuery' */
/** @typedef {import('../../domain/product/ProductsQuery').SaleTile} SaleTile */

const LIST_FOR_SALE_SQL =
  'SELECT barcode, name, price, price_cents, vat_percent, vat_kind, vat_cause, ' +
  'weighted, stock, stock_min, image_name ' +
  'FROM product ' +
  'WHERE status = ? ' +
  'AND (? IS NULL OR name LIKE ? OR barcode LIKE ?) ' +
  'AND (? IS NULL OR category_id = ?) ' +
  'ORDER BY name COLLATE NOCASE ASC ' +
  'LIMIT ?';

/**
 * Sale tiles for the sell screen. Rows stay plain objects.
 * @implements {ProductsQuery}
 */
export default class SqliteProductsQuery {

  /**
   * @param {{connection: {database: any}, images?: {readDataUrl: (name: string) => (string | null)} | null}} deps
   */
  constructor({connection, images}) {
    this._database = connection.database;
    this._images = images || null;
  }

  /**
   * @param {{text?: string, categoryId?: string, limit?: number}} [query]
   * @returns {Observable<SaleTile[]>}
   */
  listForSale({text, categoryId, limit} = {}) {
    return Rx.Observable.defer(() => {
      const needle = text == null ? '' : String(text).trim();
      const like = needle === '' ? null : '%' + needle + '%';
      const category = categoryId == null || String(categoryId).trim() === '' ? null : String(categoryId);
      const cap = normalizeLimit(limit);
      const rows = this._database.prepare(LIST_FOR_SALE_SQL).all(
        ProductStatus.ENABLED,
        like,
        like,
        like,
        category,
        category,
        cap
      );
      return Rx.Observable.of(rows.map(row => this._tile(row)));
    });
  }

  /**
   * @param {{barcode?: string | null, name?: string | null, price?: number | null, price_cents?: number | null, vat_percent?: number | null, vat_kind?: string | null, vat_cause?: string | null, weighted?: number | null, stock?: number | null, stock_min?: number | null, image_name?: string | null}} row
   * @returns {SaleTile}
   */
  _tile(row) {
    const stock = row.stock == null ? null : Number(row.stock);
    const stockMin = row.stock_min == null ? null : Number(row.stock_min);
    let imageUrl = null;
    if (this._images && row.image_name) {
      imageUrl = this._images.readDataUrl(row.image_name);
    }
    return {
      barcode: row.barcode == null ? '' : String(row.barcode),
      name: row.name == null ? '' : String(row.name),
      priceCents: moneyFromColumns(row.price_cents, row.price).cents,
      vatRate: {
        kind: row.vat_kind == null || row.vat_kind === '' ? 'S1' : String(row.vat_kind),
        percent: row.vat_percent == null ? 21 : Number(row.vat_percent),
        cause: row.vat_cause == null || row.vat_cause === '' ? null : String(row.vat_cause)
      },
      weighted: Number(row.weighted) === 1,
      lowStock: stock != null && stockMin != null && stock <= stockMin,
      imageUrl
    };
  }

}

/**
 * @param {number | undefined} limit
 * @returns {number}
 */
function normalizeLimit(limit) {
  const value = Number(limit);
  if (!Number.isInteger(value) || value <= 0) {
    return 24;
  }
  return value > 80 ? 80 : value;
}
