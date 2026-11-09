import {formatKgMilli} from '../../domain/money/formatEs';

const quantityFormat = new Intl.NumberFormat('es-ES', {maximumFractionDigits: 3});
const percentFormat = new Intl.NumberFormat('es-ES', {minimumFractionDigits: 1, maximumFractionDigits: 1});
const dayFormat = new Intl.DateTimeFormat('es-ES', {weekday: 'short', day: 'numeric'});
const periodFormat = new Intl.DateTimeFormat('es-ES', {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  year: 'numeric'
});

/**
 * @param {number} units
 * @returns {string}
 */
export function formatUnits(units) {
  const value = Number(units);
  return quantityFormat.format(Number.isFinite(value) ? value : 0);
}

/**
 * @param {number | null} ratio
 * @returns {{direction: 'up'|'down', text: string} | null}
 */
export function formatChange(ratio) {
  if (ratio == null || !Number.isFinite(ratio)) {
    return null;
  }
  return {
    direction: ratio < 0 ? 'down' : 'up',
    text: (ratio < 0 ? '▼ ' : '▲ ') + percentFormat.format(Math.abs(ratio * 100)) + ' %'
  };
}

/**
 * @param {string} from
 * @param {string} to
 * @returns {string}
 */
export function formatPeriod(from, to) {
  return formatStamp(from, periodFormat) + ' – ' + formatStamp(to, periodFormat);
}

/**
 * @param {string} iso `YYYY-MM-DD`
 * @returns {string}
 */
export function formatDay(iso) {
  return formatStamp(iso, dayFormat);
}

/**
 * @param {number | null | undefined} stock
 * @param {boolean} weighted
 * @returns {string}
 */
export function formatStock(stock, weighted) {
  const value = Number(stock);
  if (!Number.isFinite(value)) {
    return '—';
  }
  if (!weighted) {
    return quantityFormat.format(value);
  }
  return formatKgMilli(Math.round(value * 1000)) + ' kg';
}

/**
 * @param {string} value `YYYY-MM-DD` or `YYYY-MM-DD HH:mm:ss`
 * @param {Intl.DateTimeFormat} format
 * @returns {string}
 */
function formatStamp(value, format) {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value == null ? '' : String(value));
  if (!match) {
    return '';
  }
  return format.format(new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
}
