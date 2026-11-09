import moment from 'moment';

const STORED = 'YYYY-MM-DD HH:mm:ss';

/**
 * The window of the same length immediately before `from`.
 * @param {{from: string, to: string}} range
 * @returns {{from: string, to: string}}
 */
export function previousRange({from, to}) {
  const start = moment(from, STORED, true);
  const end = moment(to, STORED, true);
  const previousTo = start.clone().subtract(1, 'second');
  const previousFrom = previousTo.clone().subtract(end.diff(start), 'milliseconds');
  return {
    from: previousFrom.format(STORED),
    to: previousTo.format(STORED)
  };
}

/**
 * Inclusive calendar days covered by the stored bounds.
 * @param {{from: string, to: string}} range
 * @returns {string[]}
 */
export function eachDay({from, to}) {
  const days = [];
  const cursor = moment(from, STORED, true).startOf('day');
  const last = moment(to, STORED, true).format('YYYY-MM-DD');
  while (cursor.format('YYYY-MM-DD') <= last) {
    days.push(cursor.format('YYYY-MM-DD'));
    cursor.add(1, 'day');
  }
  return days;
}

/**
 * One column per day. The previous total is the same offset in the earlier window.
 * @param {{dates: string[], currentDays: ReadonlyArray<{soldOn: string, cashCents: number, cardCents: number, bizumCents: number}>, previousDays: ReadonlyArray<{cashCents: number, cardCents: number, bizumCents: number}>}} range
 * @returns {Array<{date: string, cashCents: number, cardCents: number, bizumCents: number, previousTotalCents: number}>}
 */
export function alignDays({dates, currentDays, previousDays}) {
  const byDate = new Map((currentDays || []).map(day => [day.soldOn, day]));
  return dates.map((date, index) => {
    const current = byDate.get(date);
    const previous = (previousDays || [])[index];
    return {
      date,
      cashCents: current ? current.cashCents : 0,
      cardCents: current ? current.cardCents : 0,
      bizumCents: current ? current.bizumCents : 0,
      previousTotalCents: previous ? dayTotal(previous) : 0
    };
  });
}

/**
 * @param {{cashCents?: number, cardCents?: number, bizumCents?: number}} day
 * @returns {number}
 */
function dayTotal(day) {
  return (day.cashCents || 0) + (day.cardCents || 0) + (day.bizumCents || 0);
}
