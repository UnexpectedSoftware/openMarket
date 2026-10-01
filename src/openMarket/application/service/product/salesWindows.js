import moment from 'moment';

export const DEFAULT_SALES_WINDOW = 'last_7_days';

export const SALES_WINDOWS = [
  {id: 'last_7_days', label: 'Last 7 days', bucket: 'day'},
  {id: 'day', label: 'Day', bucket: 'day'},
  {id: 'month', label: 'Month', bucket: 'day'},
  {id: 'three_months', label: '3 months', bucket: 'month'},
  {id: 'six_months', label: '6 months', bucket: 'month'},
  {id: 'year', label: 'Year', bucket: 'month'}
];

/**
 * @param {string} window
 * @param {moment.Moment} [now]
 * @returns {{window: string, bucket: string, startOn: string, endOn: string}}
 */
export function resolveSalesWindow(window, now = moment()) {
  const spec = SALES_WINDOWS.find(item => item.id === window);
  if (!spec) {
    throw new Error('Unknown sales window ' + window);
  }
  const end = now.clone().startOf('day');
  let start = end.clone();
  if (spec.id === 'last_7_days') {
    start = end.clone().subtract(6, 'days');
  } else if (spec.id === 'month') {
    start = end.clone().subtract(1, 'month');
  } else if (spec.id === 'three_months') {
    start = end.clone().subtract(3, 'months');
  } else if (spec.id === 'six_months') {
    start = end.clone().subtract(6, 'months');
  } else if (spec.id === 'year') {
    start = end.clone().subtract(1, 'year');
  }
  return {
    window: spec.id,
    bucket: spec.bucket,
    startOn: start.format('YYYY-MM-DD'),
    endOn: end.format('YYYY-MM-DD')
  };
}

/**
 * The same inclusive dates one year earlier.
 * @param {{startOn: string, endOn: string}} range
 * @returns {{startOn: string, endOn: string}}
 */
export function previousYearRange({startOn, endOn}) {
  return {
    startOn: moment(startOn, 'YYYY-MM-DD').subtract(1, 'year').format('YYYY-MM-DD'),
    endOn: moment(endOn, 'YYYY-MM-DD').subtract(1, 'year').format('YYYY-MM-DD')
  };
}

/**
 * Insert a zero for every day or month in the range that has no row.
 * @param {string} startOn
 * @param {string} endOn
 * @param {string} bucket
 * @param {Array} rows
 * @returns {Array.<{soldOn: string, quantity: number, amount: number}>}
 */
export function fillSeries({startOn, endOn, bucket, rows}) {
  const byKey = new Map();
  (rows || []).forEach(row => {
    byKey.set(row.soldOn, {
      quantity: Number(row.quantity) || 0,
      amount: Number(row.amount) || 0
    });
  });
  const series = [];
  if (bucket === 'month') {
    const cursor = moment(startOn, 'YYYY-MM-DD').startOf('month');
    const last = moment(endOn, 'YYYY-MM-DD').format('YYYY-MM');
    while (cursor.format('YYYY-MM') <= last) {
      series.push(point(cursor.format('YYYY-MM'), byKey));
      cursor.add(1, 'month');
    }
    return series;
  }
  const cursor = moment(startOn, 'YYYY-MM-DD');
  while (cursor.format('YYYY-MM-DD') <= endOn) {
    series.push(point(cursor.format('YYYY-MM-DD'), byKey));
    cursor.add(1, 'day');
  }
  return series;
}

function point(soldOn, byKey) {
  const found = byKey.get(soldOn);
  return {
    soldOn,
    quantity: found ? found.quantity : 0,
    amount: found ? found.amount : 0
  };
}
