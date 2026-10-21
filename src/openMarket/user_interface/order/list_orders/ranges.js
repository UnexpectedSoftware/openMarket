import {shopMoment} from '../../i18n/shopTime';

const SHOP_TIME_ZONE = 'Europe/Madrid';

export const RANGE_CHIPS = [
  {key: 'today', label: 'Hoy'},
  {key: 'yesterday', label: 'Ayer'},
  {key: 'week', label: '7 días'},
  {key: 'month', label: 'Mes'}
];

/**
 * Local-day bounds for a quick range. `week` is today and the six days before.
 * `month` runs from the 1st through `now`, not through the end of the day.
 * @param {string} key
 * @param {Date} [now]
 * @param {string} [timeZone]
 * @returns {{from: string, to: string}}
 */
export function rangeFor(key, now = new Date(), timeZone = SHOP_TIME_ZONE) {
  const local = shopMoment(now, timeZone);
  if (key === 'today') {
    return bounds(local.clone().startOf('day'), local.clone().endOf('day'));
  }
  if (key === 'yesterday') {
    const day = local.clone().subtract(1, 'day');
    return bounds(day.clone().startOf('day'), day.clone().endOf('day'));
  }
  if (key === 'week') {
    return bounds(local.clone().subtract(6, 'day').startOf('day'), local.clone().endOf('day'));
  }
  if (key === 'month') {
    return bounds(local.clone().startOf('month').startOf('day'), local.clone());
  }
  throw new Error('Unknown order range: ' + key);
}

/**
 * Inclusive local days from `type="date"` values (`YYYY-MM-DD`).
 * @param {string} fromDate
 * @param {string} toDate
 * @returns {{from: string, to: string}}
 */
export function customRange(fromDate, toDate) {
  return {
    from: fromDate + ' 00:00:00',
    to: toDate + ' 23:59:59'
  };
}

/**
 * @param {string} fromDate
 * @param {string} toDate
 * @returns {string} Empty when the range can be applied.
 */
export function customRangeMessage(fromDate, toDate) {
  if (!fromDate || !toDate) {
    return 'Elige las dos fechas';
  }
  if (fromDate > toDate) {
    return 'La fecha inicial es posterior a la final';
  }
  return '';
}

/**
 * @param {moment.Moment} from
 * @param {moment.Moment} to
 * @returns {{from: string, to: string}}
 */
function bounds(from, to) {
  return {
    from: from.format('YYYY-MM-DD HH:mm:ss'),
    to: to.format('YYYY-MM-DD HH:mm:ss')
  };
}
