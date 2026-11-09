import {shopMoment} from '../i18n/shopTime';

const SHOP_TIME_ZONE = 'Europe/Madrid';

export const RANGE_CHIPS = [
  {key: 'today', label: 'Hoy'},
  {key: 'week', label: '7 días'},
  {key: 'days30', label: '30 días'}
];

/**
 * Local-day bounds. `week` is today and the six days before.
 * `days30` is today and the twenty-nine days before.
 * @param {string} key
 * @param {Date} [now]
 * @param {string} [timeZone]
 * @returns {{from: string, to: string}}
 */
export function rangeFor(key, now = new Date(), timeZone = SHOP_TIME_ZONE) {
  const local = shopMoment(now, timeZone);
  const end = local.clone().endOf('day');
  if (key === 'today') {
    return bounds(local.clone().startOf('day'), end);
  }
  if (key === 'week') {
    return bounds(local.clone().subtract(6, 'day').startOf('day'), end);
  }
  if (key === 'days30') {
    return bounds(local.clone().subtract(29, 'day').startOf('day'), end);
  }
  throw new Error('Unknown report range: ' + key);
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
