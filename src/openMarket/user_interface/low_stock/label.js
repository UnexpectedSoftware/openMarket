import {formatStock} from '../product/list_products/format';

/**
 * "Quedan N" when the row is low and the remaining stock is a number.
 * Weighted stock uses the product-list kilogram format.
 * @param {{lowStock?: boolean, stock?: number | null, weighted?: boolean} | null | undefined} item
 * @returns {string | null}
 */
export function quedanText(item) {
  if (!item || !item.lowStock || item.stock == null || item.stock === '') {
    return null;
  }
  const stock = Number(item.stock);
  if (!Number.isFinite(stock)) {
    return null;
  }
  return 'Quedan ' + formatStock(stock, !!item.weighted);
}

/**
 * Cart line badge. A noted barcode counts as low when the line has a stock figure.
 * @param {{kind?: string, barcode?: string, lowStock?: boolean, stock?: number | null, weighted?: boolean} | null | undefined} line
 * @param {string[] | null | undefined} lowStockBarcodes
 * @returns {string | null}
 */
export function lineQuedan(line, lowStockBarcodes) {
  if (!line || line.kind === 'FREE') {
    return null;
  }
  const noted = (lowStockBarcodes || []).indexOf(line.barcode) !== -1;
  if (!line.lowStock && !noted) {
    return null;
  }
  return quedanText({
    lowStock: true,
    stock: line.stock,
    weighted: line.weighted
  });
}

/**
 * Spanish warning body for one low-stock sale.
 * @param {{name?: string, stock?: number, stockMin?: number, weighted?: boolean} | null | undefined} event
 * @returns {string}
 */
export function lowStockMessage(event) {
  const source = event || {};
  const name = source.name == null ? '' : String(source.name);
  const weighted = source.weighted === true;
  const left = formatStock(source.stock, weighted);
  const minimum = formatStock(source.stockMin, weighted);
  return 'Quedan ' + left + ' de ' + name + ' (mínimo ' + minimum + ').';
}
