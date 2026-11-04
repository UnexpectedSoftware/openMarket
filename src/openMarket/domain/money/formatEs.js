import Money from './Money';

const euroFormat = new Intl.NumberFormat('es-ES', {
  style: 'currency',
  currency: 'EUR'
});

/**
 * Euro cents for a Spanish ticket or screen. A non-integer is zero.
 * @param {number} cents
 * @returns {string}
 */
export function formatEuroCents(cents) {
  const value = Number.isInteger(cents) ? cents : 0;
  return euroFormat.format(Money.ofCents(value).toEuros());
}

/**
 * Kilograms from milli-units with a Spanish comma, up to three decimals and no
 * trailing zeros: 2800 -> `2,8`, 350 -> `0,35`, 1000 -> `1`. A non-integer is zero.
 * @param {number} milli
 * @returns {string}
 */
export function formatKgMilli(milli) {
  const value = Number.isInteger(milli) ? milli : 0;
  const abs = Math.abs(value);
  const frac = abs % 1000;
  const whole = String(Math.trunc(abs / 1000));
  const body = frac === 0 ? whole : whole + ',' + String(frac).padStart(3, '0').replace(/0+$/, '');
  return value < 0 ? '-' + body : body;
}

/**
 * A milli-unit quantity with a Spanish comma, formatted like kilograms.
 */
export const formatQuantityMilli = formatKgMilli;

/**
 * Shop date and time, `dd/mm/yyyy hh:mm`. Empty when neither part is present.
 * @param {string | null | undefined} issueDate `YYYY-MM-DD`
 * @param {string | null | undefined} issuedAt Offset timestamp or `hh:mm:ss`
 * @returns {string}
 */
export function formatTicketWhen(issueDate, issuedAt) {
  const date = /^(\d{4})-(\d{2})-(\d{2})$/.exec(issueDate == null ? '' : String(issueDate));
  const stamp = issuedAt == null ? '' : String(issuedAt);
  const time = /T(\d{2}):(\d{2})/.exec(stamp) || /^(\d{2}):(\d{2})/.exec(stamp);
  const day = date ? date[3] + '/' + date[2] + '/' + date[1] : '';
  const clock = time ? time[1] + ':' + time[2] : '';
  return (day + ' ' + clock).trim();
}
