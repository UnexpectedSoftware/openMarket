const whole = new Intl.NumberFormat('es-ES', {maximumFractionDigits: 0});
const kilos = new Intl.NumberFormat('es-ES', {maximumFractionDigits: 3});

/**
 * Integer percent, or an em dash when the price cannot produce one.
 * @param {number | null | undefined} percent
 * @returns {string}
 */
export function formatMargin(percent) {
  if (percent == null || !Number.isFinite(Number(percent))) {
    return '—';
  }
  return String(percent) + ' %';
}

/**
 * A count, or kilograms (es-ES) when the product is sold by weight.
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
    return whole.format(value);
  }
  const text = Number.isInteger(value) ? whole.format(value) : kilos.format(value);
  return text + ' kg';
}
