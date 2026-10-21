/**
 * Sales, ticket count, and average ticket for one period.
 * The average is the cent total divided by the ticket count, half-up.
 * It is 0 when the period has no tickets.
 */
export default class OrderRangeSummary {

  /**
   * @param {{totalCents: number, ticketCount: number}} props
   */
  constructor({totalCents, ticketCount}) {
    this.totalCents = totalCents;
    this.ticketCount = ticketCount;
    this.averageCents = averageCents(totalCents, ticketCount);
    Object.freeze(this);
  }

}

/**
 * @param {number} totalCents
 * @param {number} ticketCount
 * @returns {number}
 */
function averageCents(totalCents, ticketCount) {
  if (!ticketCount) {
    return 0;
  }
  return Math.round(totalCents / ticketCount);
}
