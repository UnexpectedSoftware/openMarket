import Order from "../../domain/order/Order";
/** @typedef {import("../../domain/order/OrderFactory").default} OrderFactory */
/** @typedef {import("../../domain/order/Order").OrderLine} OrderLine */

/** @implements {OrderFactory} */
export default class OrderFactoryImpl {

  /**
   * @param {{identity: {generate: () => string}, clock?: {zonedNow: () => {local: string}}}} deps
   */
  constructor({identity, clock}){
    this._identity = identity;
    this._clock = clock || null;
  }

  /**
   * Builds a draft. The caller places it before saving.
   * The display time comes from the shop clock when the caller omits a date.
   * @param {{id?: string, lines?: OrderLine[], date?: string}} [order]
   * @returns {Order}
   */
  createWith({id = this._identity.generate(), lines, date} = {}) {
    return new Order({
        id: id,
        lines: lines || [],
        date: date || displayNow(this._clock)
      });
  }
}

/**
 * `DD/MM/YYYY HH:mm:ss` from an offset timestamp. Undefined keeps the order's own default.
 * @param {{zonedNow: () => {local: string}} | null} clock
 * @returns {string | undefined}
 */
function displayNow(clock) {
  if (!clock || typeof clock.zonedNow !== 'function') {
    return undefined;
  }
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})/.exec(clock.zonedNow().local);
  if (!match) {
    return undefined;
  }
  return `${match[3]}/${match[2]}/${match[1]} ${match[4]}:${match[5]}:${match[6]}`;
}
