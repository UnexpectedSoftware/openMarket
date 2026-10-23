import Money from '../../../domain/money/Money';
import Quantity from '../../../domain/money/Quantity';
import {formatMoney} from '../../i18n/money';

const wholeKg = new Intl.NumberFormat('es-ES', {maximumFractionDigits: 0});
const partialKg = new Intl.NumberFormat('es-ES', {
  minimumFractionDigits: 3,
  maximumFractionDigits: 3
});

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

/**
 * Shop-local date and time, `dd/mm/yyyy hh:mm`.
 * @param {string | null | undefined} createdAt
 * @returns {string}
 */
export function orderWhen(createdAt) {
  const match = /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})/.exec(createdAt == null ? '' : String(createdAt));
  if (!match) {
    return '';
  }
  return match[3] + '/' + match[2] + '/' + match[1] + ' ' + match[4] + ':' + match[5];
}

/**
 * Cash names the notes handed over. Card is the method alone.
 * @param {{method?: string | null, tenderedCents?: number | null, changeCents?: number | null} | null | undefined} payment
 * @returns {string}
 */
export function paymentLine(payment) {
  if (!payment) {
    return '';
  }
  const label = paymentLabel(payment.method);
  if (payment.method !== 'cash' || !hasNotes(payment)) {
    return label;
  }
  return label + ' (entregado ' + formatMoney(Money.ofCents(payment.tenderedCents)) +
    ', cambio ' + formatMoney(Money.ofCents(payment.changeCents)) + ')';
}

/**
 * @param {{tenderedCents?: number | null, changeCents?: number | null}} payment
 * @returns {boolean}
 */
function hasNotes(payment) {
  return Number.isInteger(payment.tenderedCents) && Number.isInteger(payment.changeCents);
}

/**
 * @param {number | null | undefined} milli
 * @returns {string}
 */
export function formatKg(milli) {
  const quantity = Number.isInteger(milli) ? Quantity.ofMilli(milli) : Quantity.ofMilli(0);
  const format = quantity.milli % 1000 === 0 ? wholeKg : partialKg;
  return format.format(quantity.units);
}

/**
 * A partial kilo keeps three decimals (`0,350 kg × 18,50 €/kg`). A whole kilo does not (`1 kg × 6,99 €/kg`).
 * @param {{quantityMilli: number, unitPriceCents: number}} line
 * @returns {string}
 */
export function weightedPrice(line) {
  return formatKg(line.quantityMilli) + ' kg × ' + formatMoney(Money.ofCents(line.unitPriceCents)) + '/kg';
}

/**
 * @param {{kind?: string, percent?: number, cause?: string | null} | null | undefined} row
 * @returns {string}
 */
export function vatLabel(row) {
  if (!row) {
    return '';
  }
  if (row.kind === 'E') {
    return 'Exento ' + (row.cause || '');
  }
  if (row.kind === 'N') {
    return 'No sujeto ' + (row.cause || '');
  }
  return String(row.percent == null ? '' : row.percent) + ' %';
}
