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
    days,
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
    this.days = Object.freeze((days || []).map(freezeDay));
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
 * @property {Array<{date: string, cashCents: number, cardCents: number, bizumCents: number, previousTotalCents: number}>} [days]
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
 * @param {{date: string, cashCents: number, cardCents: number, bizumCents: number, previousTotalCents: number}} day
 * @returns {{date: string, cashCents: number, cardCents: number, bizumCents: number, previousTotalCents: number}}
 */
function freezeDay(day) {
  return Object.freeze({
    date: day.date,
    cashCents: day.cashCents,
    cardCents: day.cardCents,
    bizumCents: day.bizumCents,
    previousTotalCents: day.previousTotalCents
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
