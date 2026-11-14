/**
 * The Resumen screen: one period against the period of the same length before it.
 * Change ratios are null when the previous value is 0.
 */
export default class ReportSummary {

  /**
   * @param {ReportSummaryProps} props
   */
  constructor({
    from,
    to,
    previousFrom,
    previousTo,
    salesCents,
    previousSalesCents,
    ticketCount,
    previousTicketCount,
    averageCents,
    previousAverageCents,
    units,
    previousUnits,
    grain,
    buckets,
    firstSale,
    lastSale,
    mostSold,
    lowStockTotal,
    lowStockItems
  }) {
    this.from = from;
    this.to = to;
    this.previousFrom = previousFrom;
    this.previousTo = previousTo;
    this.salesCents = salesCents;
    this.previousSalesCents = previousSalesCents;
    this.ticketCount = ticketCount;
    this.previousTicketCount = previousTicketCount;
    this.averageCents = averageCents;
    this.previousAverageCents = previousAverageCents;
    this.units = units;
    this.previousUnits = previousUnits;
    this.salesChange = changeRatio(salesCents, previousSalesCents);
    this.ticketChange = changeRatio(ticketCount, previousTicketCount);
    this.averageChange = changeRatio(averageCents, previousAverageCents);
    this.unitsChange = changeRatio(units, previousUnits);
    this.grain = grain === 'week' || grain === 'month' ? grain : 'day';
    this.buckets = Object.freeze((buckets || []).map(freezeBucket));
    this.firstSale = firstSale || null;
    this.lastSale = lastSale || null;
    this.mostSold = Object.freeze((mostSold || []).map(freezeSold));
    this.lowStock = Object.freeze({
      total: lowStockTotal,
      items: Object.freeze((lowStockItems || []).map(freezeStock))
    });
    Object.freeze(this);
  }

}

/**
 * @typedef {object} ReportSummaryProps
 * @property {string} from
 * @property {string} to
 * @property {string} previousFrom
 * @property {string} previousTo
 * @property {number} salesCents
 * @property {number} previousSalesCents
 * @property {number} ticketCount
 * @property {number} previousTicketCount
 * @property {number} averageCents
 * @property {number} previousAverageCents
 * @property {number} units
 * @property {number} previousUnits
 * @property {'day'|'week'|'month'} [grain]
 * @property {SalesBucket[]} [buckets]
 * @property {string|null} [firstSale] First sale, when leading empty buckets were dropped.
 * @property {string|null} [lastSale] Last sale, when trailing empty buckets were dropped.
 * @property {Array<{barcode: string, name: string, quantity: number, amountCents: number}>} [mostSold]
 * @property {number} lowStockTotal
 * @property {Array<{barcode: string, name: string, stock: number | null, stockMin: number | null, weighted?: boolean}>} [lowStockItems]
 */

/**
 * @param {number} current
 * @param {number} previous
 * @returns {number | null}
 */
function changeRatio(current, previous) {
  if (!previous) {
    return null;
  }
  return (current - previous) / previous;
}

/**
 * @typedef {object} SalesBucket
 * @property {string} from `YYYY-MM-DD`
 * @property {string} to `YYYY-MM-DD`
 * @property {number} cashCents
 * @property {number} cardCents
 * @property {number} bizumCents
 * @property {number} previousTotalCents
 */

/**
 * @param {SalesBucket} bucket
 * @returns {SalesBucket}
 */
function freezeBucket(bucket) {
  return Object.freeze({
    from: bucket.from,
    to: bucket.to,
    cashCents: bucket.cashCents,
    cardCents: bucket.cardCents,
    bizumCents: bucket.bizumCents,
    previousTotalCents: bucket.previousTotalCents
  });
}

/**
 * @param {{barcode: string, name: string, quantity: number, amountCents: number}} row
 * @returns {{barcode: string, name: string, quantity: number, amountCents: number}}
 */
function freezeSold(row) {
  return Object.freeze({
    barcode: row.barcode,
    name: row.name,
    quantity: row.quantity,
    amountCents: row.amountCents
  });
}

/**
 * @param {{barcode: string, name: string, stock: number | null, stockMin: number | null, weighted?: boolean}} item
 * @returns {{barcode: string, name: string, stock: number | null, stockMin: number | null, weighted: boolean}}
 */
function freezeStock(item) {
  return Object.freeze({
    barcode: item.barcode,
    name: item.name,
    stock: item.stock,
    stockMin: item.stockMin,
    weighted: !!item.weighted
  });
}
