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
 * A milli-unit quantity with a Spanish comma. Whole units drop the fraction.
 * @param {number} milli
 * @returns {string}
 */
export function formatQuantityMilli(milli) {
  const value = Number.isInteger(milli) ? milli : 0;
  const negative = value < 0;
  const abs = Math.abs(value);
  const whole = Math.trunc(abs / 1000);
  const frac = abs % 1000;
  const body = frac === 0
    ? String(whole)
    : whole + ',' + String(frac).padStart(3, '0').replace(/0+$/, '');
  return negative ? '-' + body : body;
}

/**
 * Weight in kilograms with three decimals, `0,350`.
 * @param {number} milli
 * @returns {string}
 */
export function formatKgMilli(milli) {
  const value = Number.isInteger(milli) ? milli : 0;
  const negative = value < 0;
  const abs = Math.abs(value);
  const body = Math.trunc(abs / 1000) + ',' + String(abs % 1000).padStart(3, '0');
  return negative ? '-' + body : body;
}

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
