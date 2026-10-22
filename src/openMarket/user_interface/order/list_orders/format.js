/**
 * @param {string | null | undefined} createdAt
 * @returns {string}
 */
export function clockTime(createdAt) {
  const match = /(\d{2}:\d{2})/.exec(createdAt == null ? '' : String(createdAt));
  return match ? match[1] : '';
}

/**
 * @param {string | null | undefined} method
 * @returns {string}
 */
export function paymentLabel(method) {
  if (method === 'cash') {
    return 'Efectivo';
  }
  if (method === 'card') {
    return 'Tarjeta';
  }
  return '';
}

/**
 * @param {number} count
 * @returns {string}
 */
export function itemLabel(count) {
  const value = Number(count);
  if (value === 1) {
    return '1 artículo';
  }
  const shown = Number.isFinite(value) ? value : 0;
  return shown + ' artículos';
}

/**
 * @param {{createdAt?: string, itemCount?: number, paymentMethod?: string | null}} item
 * @returns {string}
 */
export function orderMeta(item) {
  return [clockTime(item.createdAt), itemLabel(item.itemCount), paymentLabel(item.paymentMethod)]
    .filter(part => part)
    .join(' · ');
}
