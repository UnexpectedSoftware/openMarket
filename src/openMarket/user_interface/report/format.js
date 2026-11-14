import {formatKgMilli} from '../../domain/money/formatEs';
import Money from '../../domain/money/Money';
import {formatMoney} from '../i18n/money';

const quantityFormat = new Intl.NumberFormat('es-ES', {maximumFractionDigits: 3});
const percentFormat = new Intl.NumberFormat('es-ES', {minimumFractionDigits: 1, maximumFractionDigits: 1});
const CHART_MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
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
 * Day and short month for a chart caption or tick, `28 sep`.
 * @param {string} iso `YYYY-MM-DD`
 * @returns {string}
 */
export function formatChartDay(iso) {
  const parts = calendarParts(iso);
  if (!parts) {
    return '';
  }
  return parts.day + ' ' + CHART_MONTHS[parts.month - 1];
}

/**
 * @param {{from: string, to: string}} bucket
 * @param {'day'|'week'|'month'} grain
 * @returns {string}
 */
export function formatBucketRange(bucket, grain) {
  const start = calendarParts(bucket.from);
  const end = calendarParts(bucket.to);
  if (!start || !end) {
    return '';
  }
  if (grain === 'month') {
    return CHART_MONTHS[start.month - 1] + ' ' + start.year;
  }
  if (bucket.from.slice(0, 10) === bucket.to.slice(0, 10)) {
    return formatChartDay(bucket.from);
  }
  if (start.year === end.year && start.month === end.month) {
    return start.day + '–' + end.day + ' ' + CHART_MONTHS[start.month - 1];
  }
  const sameYear = start.year === end.year;
  const startText = formatChartDay(bucket.from) + (sameYear ? '' : ' ' + start.year);
  const endText = formatChartDay(bucket.to) + (sameYear ? '' : ' ' + end.year);
  return startText + ' – ' + endText;
}

/**
 * @param {{firstSale?: string|null, lastSale?: string|null}} edges
 * @returns {string}
 */
export function formatSalesGap({firstSale, lastSale}) {
  if (firstSale && lastSale) {
    return 'Sin ventas antes del ' + formatChartDay(firstSale) + ' ni después del ' + formatChartDay(lastSale);
  }
  if (firstSale) {
    return 'Sin ventas antes del ' + formatChartDay(firstSale);
  }
  if (lastSale) {
    return 'Sin ventas después del ' + formatChartDay(lastSale);
  }
  return '';
}

/**
 * @param {{from: string, to: string, cashCents: number, cardCents: number, bizumCents: number}} bucket
 * @param {'day'|'week'|'month'} grain
 * @returns {string}
 */
export function formatBucketTooltip(bucket, grain) {
  return formatBucketRange(bucket, grain)
    + ' · Efectivo ' + formatMoney(Money.ofCents(bucket.cashCents))
    + ' · Tarjeta ' + formatMoney(Money.ofCents(bucket.cardCents))
    + ' · Bizum ' + formatMoney(Money.ofCents(bucket.bizumCents));
}

/**
 * One label per bucket. A blank string leaves a gap so month labels do not collide.
 * @param {Array<{from: string, to: string}>} buckets
 * @param {'day'|'week'|'month'} grain
 * @returns {string[]}
 */
export function axisLabels(buckets, grain) {
  const gap = labelGap(buckets.length, grain);
  const show = new Array(buckets.length).fill(false);
  buckets.forEach((bucket, index) => {
    if (isAnchor(buckets, index, grain)) {
      show[index] = true;
    }
  });
  buckets.forEach((bucket, index) => {
    if (show[index] || nearestShown(show, index) < gap) {
      return;
    }
    show[index] = true;
  });
  return buckets.map((bucket, index) => (show[index] ? tickText(bucket, index, buckets, grain) : ''));
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
 * @param {string | null | undefined} value
 * @returns {{year: number, month: number, day: number} | null}
 */
function calendarParts(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value == null ? '' : String(value));
  if (!match) {
    return null;
  }
  return {year: Number(match[1]), month: Number(match[2]), day: Number(match[3])};
}

/**
 * @param {number} count
 * @param {'day'|'week'|'month'} grain
 * @returns {number}
 */
function labelGap(count, grain) {
  if (grain !== 'day') {
    return count <= 6 ? 1 : 3;
  }
  if (count <= 16) {
    return 1;
  }
  if (count <= 31) {
    return 3;
  }
  return 5;
}

/**
 * @param {Array<{from: string}>} buckets
 * @param {number} index
 * @param {'day'|'week'|'month'} grain
 * @returns {boolean}
 */
function isAnchor(buckets, index, grain) {
  if (index === 0) {
    return true;
  }
  if (grain === 'month') {
    return buckets[index].from.slice(0, 4) !== buckets[index - 1].from.slice(0, 4);
  }
  return buckets[index].to.slice(0, 7) !== buckets[index - 1].to.slice(0, 7);
}

/**
 * @param {boolean[]} show
 * @param {number} index
 * @returns {number}
 */
function nearestShown(show, index) {
  let nearest = show.length;
  show.forEach((visible, cursor) => {
    if (!visible) {
      return;
    }
    const distance = Math.abs(cursor - index);
    if (distance < nearest) {
      nearest = distance;
    }
  });
  return nearest;
}

/**
 * @param {{from: string, to: string}} bucket
 * @param {number} index
 * @param {Array<{from: string}>} buckets
 * @param {'day'|'week'|'month'} grain
 * @returns {string}
 */
function tickText(bucket, index, buckets, grain) {
  if (grain !== 'day') {
    return formatBucketRange(bucket, grain);
  }
  const current = calendarParts(bucket.from);
  const previous = index > 0 ? calendarParts(buckets[index - 1].from) : null;
  if (!current) {
    return '';
  }
  const monthChanged = !previous || previous.month !== current.month || previous.year !== current.year;
  if (index > 0 && !monthChanged) {
    return String(current.day);
  }
  if (previous && previous.year !== current.year) {
    return formatChartDay(bucket.from) + ' ' + current.year;
  }
  return formatChartDay(bucket.from);
}

/**
 * @param {string} value `YYYY-MM-DD` or `YYYY-MM-DD HH:mm:ss`
 * @param {Intl.DateTimeFormat} format
 * @returns {string}
 */
function formatStamp(value, format) {
  const parts = calendarParts(value);
  if (!parts) {
    return '';
  }
  return format.format(new Date(parts.year, parts.month - 1, parts.day));
}
