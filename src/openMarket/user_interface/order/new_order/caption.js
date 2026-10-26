import {formatMoney} from '../../i18n/money';
import {formatStock} from '../../product/list_products/format';

/**
 * Spanish decimal for a quantity. The cart input keeps the raw value the tests type.
 * @param {{units?: number} | number | null | undefined} quantity
 * @param {number} decimals
 * @returns {string}
 */
export function formatQuantity(quantity, decimals) {
  if (quantity == null || quantity === '') {
    return '';
  }
  const units = typeof quantity.units === 'number' ? quantity.units : Number(quantity);
  if (!Number.isFinite(units)) {
    return '';
  }
  return new Intl.NumberFormat('es-ES', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(units);
}

/**
 * Unit price under the product name.
 * @param {object | null | undefined} line
 * @returns {string}
 */
export function lineCaption(line) {
  if (!line || !line.unitPrice) {
    return '';
  }
  if (line.kind === 'FREE') {
    return formatMoney(line.unitPrice);
  }
  if (line.weighted) {
    return weightLabel(line) + ' × ' + formatMoney(line.unitPrice) + '/kg';
  }
  return formatMoney(line.unitPrice) + ' / ud';
}

/**
 * Weight pill for a weighed line. Empty for anything else.
 * @param {object | null | undefined} line
 * @returns {string}
 */
export function weightLabel(line) {
  if (!line || !line.weighted || !line.quantity) {
    return '';
  }
  return formatStock(line.quantity.units, true);
}

/**
 * @param {{lineCount?: number, articleCount?: number} | null | undefined} facts
 * @returns {string}
 */
export function ticketCountLabel(facts) {
  const lines = facts && facts.lineCount ? facts.lineCount : 0;
  const articles = facts && facts.articleCount ? facts.articleCount : 0;
  return plural(lines, 'línea', 'líneas') + ' · ' + plural(articles, 'artículo', 'artículos');
}

/**
 * @param {string[] | null | undefined} rates
 * @returns {string}
 */
export function vatIncludedLabel(rates) {
  if (!rates || !rates.length) {
    return 'IVA incluido';
  }
  return 'IVA incluido (' + rates.join(' · ') + ')';
}

/**
 * @param {number} count
 * @param {string} one
 * @param {string} many
 * @returns {string}
 */
function plural(count, one, many) {
  return count + ' ' + (count === 1 ? one : many);
}
