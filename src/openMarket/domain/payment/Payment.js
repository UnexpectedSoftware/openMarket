import Money from '../money/Money';
import InvalidPaymentError from './InvalidPaymentError';

/**
 * How an order was paid. Cash change is tendered minus the total.
 * A card payment tenders the total and gives no change.
 */
export default class Payment {

  /**
   * Cash that covers the total. Change is tendered minus the total.
   * @param {{total: Money | number | string, tendered: Money | number | string}} params
   * @returns {Payment}
   */
  static cash({total, tendered}) {
    const due = moneyOf(total, 'cash');
    const given = moneyOf(tendered, 'cash');
    if (given.cents < due.cents) {
      throw new InvalidPaymentError({
        method: 'cash',
        tenderedCents: given.cents,
        totalCents: due.cents
      });
    }
    return new Payment({
      method: 'cash',
      tenderedCents: given.cents,
      changeCents: given.cents - due.cents
    });
  }

  /**
   * A card payment for the exact total. Tendered defaults to the total.
   * @param {{total: Money | number | string, tendered?: Money | number | string}} params
   * @returns {Payment}
   */
  static card({total, tendered}) {
    const due = moneyOf(total, 'card');
    const given = tendered == null ? due : moneyOf(tendered, 'card');
    if (given.cents !== due.cents) {
      throw new InvalidPaymentError({
        method: 'card',
        tenderedCents: given.cents,
        totalCents: due.cents
      });
    }
    return new Payment({method: 'card', tenderedCents: due.cents, changeCents: 0});
  }

  /**
   * Builds the payment the till and CreateOrder both accept.
   * @param {{total: Money | number | string, method?: string, tendered?: Money | number | string}} params
   * @returns {Payment}
   */
  static settle({total, method, tendered}) {
    if (method === 'cash') {
      return Payment.cash({total, tendered});
    }
    if (method === 'card') {
      return Payment.card({total, tendered});
    }
    throw new InvalidPaymentError({method: method == null ? undefined : String(method)});
  }

  /**
   * A payment already stored on an order. Null when the row has no method.
   * @param {{method?: string | null, tenderedCents?: number | null, changeCents?: number | null}} [params]
   * @returns {Payment | null}
   */
  static restore({method, tenderedCents, changeCents} = {}) {
    if (method == null || method === '') {
      return null;
    }
    if (method !== 'cash' && method !== 'card') {
      throw new InvalidPaymentError({method: String(method)});
    }
    if (!Number.isInteger(tenderedCents) || !Number.isInteger(changeCents) || changeCents < 0) {
      throw new InvalidPaymentError({method, tenderedCents, changeCents});
    }
    if (method === 'card' && (changeCents !== 0 || tenderedCents < 0)) {
      throw new InvalidPaymentError({method, tenderedCents, changeCents});
    }
    if (method === 'cash' && tenderedCents < changeCents) {
      throw new InvalidPaymentError({method, tenderedCents, changeCents});
    }
    return new Payment({method, tenderedCents, changeCents});
  }

  /**
   * @param {{method: 'cash' | 'card', tenderedCents: number, changeCents: number}} props
   */
  constructor({method, tenderedCents, changeCents}) {
    /** @private */
    this._method = method;
    /** @private */
    this._tenderedCents = tenderedCents;
    /** @private */
    this._changeCents = changeCents;
  }

  /** @returns {'cash' | 'card'} */
  get method() {
    return this._method;
  }

  /** @returns {number} */
  get tenderedCents() {
    return this._tenderedCents;
  }

  /** @returns {number} */
  get changeCents() {
    return this._changeCents;
  }

}

/**
 * @param {*} value
 * @param {'cash' | 'card'} method
 * @returns {Money}
 */
function moneyOf(value, method) {
  try {
    return Money.from(value);
  } catch (error) {
    throw new InvalidPaymentError({method});
  }
}
