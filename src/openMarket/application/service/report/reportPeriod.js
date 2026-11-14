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

const DAY_BUCKETS = 45;
const WEEK_BUCKETS = 180;
const DAY_KEY = 'YYYY-MM-DD';

/**
 * Day, week, or month columns for the selected range. Sums stay in integer cents.
 * Leading and trailing buckets with no sales in this range are dropped. Empty
 * buckets between the first and last sale stay.
 * @param {{from: string, to: string, currentDays: ReadonlyArray<{soldOn: string, cashCents: number, cardCents: number, bizumCents: number}>, previousDays: ReadonlyArray<{cashCents: number, cardCents: number, bizumCents: number}>}} range
 * @returns {{grain: 'day'|'week'|'month', buckets: SalesBucket[], firstSale: string|null, lastSale: string|null}}
 */
export function bucketSales({from, to, currentDays, previousDays}) {
  const dates = eachDay({from, to});
  const aligned = alignDays({dates, currentDays, previousDays});
  const grain = grainFor(dates.length);
  const sales = saleEdges(aligned);
  if (!sales.first) {
    return {grain, buckets: [], firstSale: null, lastSale: null};
  }
  const grouped = groupAligned(aligned, grain);
  const buckets = grouped.filter(bucket => bucket.to >= sales.first && bucket.from <= sales.last);
  return {
    grain,
    buckets,
    firstSale: buckets[0].from > grouped[0].from ? sales.first : null,
    lastSale: buckets[buckets.length - 1].to < grouped[grouped.length - 1].to ? sales.last : null
  };
}

/**
 * @param {number} dayCount Inclusive days in the selected range.
 * @returns {'day'|'week'|'month'}
 */
function grainFor(dayCount) {
  if (dayCount <= DAY_BUCKETS) {
    return 'day';
  }
  if (dayCount <= WEEK_BUCKETS) {
    return 'week';
  }
  return 'month';
}

/**
 * @param {Array<{date: string, cashCents: number, cardCents: number, bizumCents: number, previousTotalCents: number}>} days
 * @returns {{first: string|null, last: string|null}}
 */
function saleEdges(days) {
  let first = null;
  let last = null;
  days.forEach(day => {
    if (dayTotal(day) <= 0) {
      return;
    }
    if (!first) {
      first = day.date;
    }
    last = day.date;
  });
  return {first, last};
}

/**
 * @param {Array<{date: string, cashCents: number, cardCents: number, bizumCents: number, previousTotalCents: number}>} days
 * @param {'day'|'week'|'month'} grain
 * @returns {SalesBucket[]}
 */
function groupAligned(days, grain) {
  const buckets = [];
  let current = null;
  let key = '';
  days.forEach(day => {
    const nextKey = bucketKey(day.date, grain);
    if (!current || nextKey !== key) {
      current = {
        from: day.date,
        to: day.date,
        cashCents: day.cashCents,
        cardCents: day.cardCents,
        bizumCents: day.bizumCents,
        previousTotalCents: day.previousTotalCents
      };
      key = nextKey;
      buckets.push(current);
      return;
    }
    current.to = day.date;
    current.cashCents += day.cashCents;
    current.cardCents += day.cardCents;
    current.bizumCents += day.bizumCents;
    current.previousTotalCents += day.previousTotalCents;
  });
  return buckets;
}

/**
 * @param {string} date `YYYY-MM-DD`
 * @param {'day'|'week'|'month'} grain
 * @returns {string}
 */
function bucketKey(date, grain) {
  if (grain === 'month') {
    return date.slice(0, 7);
  }
  if (grain === 'week') {
    return moment(date, DAY_KEY, true).startOf('isoWeek').format(DAY_KEY);
  }
  return date;
}

/**
 * @typedef {object} SalesBucket
 * @property {string} from
 * @property {string} to
 * @property {number} cashCents
 * @property {number} cardCents
 * @property {number} bizumCents
 * @property {number} previousTotalCents
 */
