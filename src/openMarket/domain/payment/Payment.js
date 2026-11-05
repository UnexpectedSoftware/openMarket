import Money from '../money/Money';
import InvalidPaymentError from './InvalidPaymentError';

const EXACT = ['card', 'bizum'];
const PARTS = ['cash', 'card', 'bizum'];

/**
 * How an order was paid. Cash change is tendered minus the total.
 * Card and Bizum tender the total and give no change.
 * A split payment is two exact parts that add up to the total.
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
    return Payment.exact({total, tendered, method: 'card'});
  }

  /**
   * Bizum for the exact total. Tendered defaults to the total.
   * @param {{total: Money | number | string, tendered?: Money | number | string}} params
   * @returns {Payment}
   */
  static bizum({total, tendered}) {
    return Payment.exact({total, tendered, method: 'bizum'});
  }

  /**
   * Two parts that add up to the total. Neither part gives change.
   * @param {{total: Money | number | string, parts: Array<{method: string, amountCents?: number, amount?: Money | number | string}>}} params
   * @returns {Payment}
   */
  static mixed({total, parts}) {
    const due = moneyOf(total, 'mixed');
    const split = splitParts(parts, due.cents);
    return new Payment({
      method: 'mixed',
      tenderedCents: due.cents,
      changeCents: 0,
      parts: split
    });
  }

  /**
   * Builds the payment the till and CreateOrder both accept.
   * @param {{total: Money | number | string, method?: string, tendered?: Money | number | string, parts?: Array<{method: string, amountCents?: number}>}} params
   * @returns {Payment}
   */
  static settle({total, method, tendered, parts}) {
    if (method === 'cash') {
      return Payment.cash({total, tendered});
    }
    if (method === 'card') {
      return Payment.card({total, tendered});
    }
    if (method === 'bizum') {
      return Payment.bizum({total, tendered});
    }
    if (method === 'mixed') {
      return Payment.mixed({total, parts});
    }
    throw new InvalidPaymentError({method: method == null ? undefined : String(method)});
  }

  /**
   * A payment already stored on an order. Null when the row has no method.
   * @param {{method?: string | null, tenderedCents?: number | null, changeCents?: number | null, parts?: Array<{method: string, amountCents: number}> | string | null}} [params]
   * @returns {Payment | null}
   */
  static restore({method, tenderedCents, changeCents, parts} = {}) {
    if (method == null || method === '') {
      return null;
    }
    if (method === 'mixed') {
      return restoreMixed({tenderedCents, changeCents, parts});
    }
    if (method !== 'cash' && EXACT.indexOf(method) === -1) {
      throw new InvalidPaymentError({method: String(method)});
    }
    if (!Number.isInteger(tenderedCents) || !Number.isInteger(changeCents) || changeCents < 0) {
      throw new InvalidPaymentError({method, tenderedCents, changeCents});
    }
    if (EXACT.indexOf(method) !== -1 && (changeCents !== 0 || tenderedCents < 0)) {
      throw new InvalidPaymentError({method, tenderedCents, changeCents});
    }
    if (method === 'cash' && tenderedCents < changeCents) {
      throw new InvalidPaymentError({method, tenderedCents, changeCents});
    }
    return new Payment({method: /** @type {'cash' | 'card' | 'bizum'} */ (method), tenderedCents, changeCents});
  }

  /**
   * @param {{method: 'cash' | 'card' | 'bizum' | 'mixed', tenderedCents: number, changeCents: number, parts?: Array<{method: string, amountCents: number}> | null}} props
   */
  constructor({method, tenderedCents, changeCents, parts}) {
    /** @private */
    this._method = method;
    /** @private */
    this._tenderedCents = tenderedCents;
    /** @private */
    this._changeCents = changeCents;
    /** @private */
    this._parts = parts ? parts.map(part => ({method: part.method, amountCents: part.amountCents})) : null;
  }

  /** @returns {'cash' | 'card' | 'bizum' | 'mixed'} */
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

  /** @returns {Array<{method: string, amountCents: number}> | null} */
  get parts() {
    return this._parts ? this._parts.map(part => ({method: part.method, amountCents: part.amountCents})) : null;
  }

  /**
   * @param {{total: Money | number | string, tendered?: Money | number | string, method: 'card' | 'bizum'}} params
   * @returns {Payment}
   */
  static exact({total, tendered, method}) {
    const due = moneyOf(total, method);
    const given = tendered == null ? due : moneyOf(tendered, method);
    if (given.cents !== due.cents) {
      throw new InvalidPaymentError({
        method,
        tenderedCents: given.cents,
        totalCents: due.cents
      });
    }
    return new Payment({method, tenderedCents: due.cents, changeCents: 0});
  }

}

/**
 * @param {Array<{method?: string, amountCents?: number, amount?: Money | number | string}> | null | undefined} parts
 * @param {number} totalCents
 * @returns {Array<{method: string, amountCents: number}>}
 */
function splitParts(parts, totalCents) {
  if (!Array.isArray(parts) || parts.length !== 2) {
    throw new InvalidPaymentError({method: 'mixed'});
  }
  const split = parts.map(part => {
    const method = part && part.method;
    if (PARTS.indexOf(method) === -1) {
      throw new InvalidPaymentError({method: 'mixed'});
    }
    const amount = part.amountCents != null
      ? moneyOf(Money.ofCents(part.amountCents), method)
      : moneyOf(part.amount, method);
    if (amount.cents <= 0) {
      throw new InvalidPaymentError({method: 'mixed', tenderedCents: amount.cents, totalCents});
    }
    return {method, amountCents: amount.cents};
  });
  if (split[0].method === split[1].method) {
    throw new InvalidPaymentError({method: 'mixed'});
  }
  if (split[0].amountCents + split[1].amountCents !== totalCents) {
    throw new InvalidPaymentError({method: 'mixed', totalCents});
  }
  return split;
}

/**
 * @param {{tenderedCents?: number | null, changeCents?: number | null, parts?: Array<{method: string, amountCents: number}> | string | null}} stored
 * @returns {Payment}
 */
function restoreMixed({tenderedCents, changeCents, parts}) {
  const parsed = typeof parts === 'string' ? parseParts(parts) : parts;
  if (!Number.isInteger(tenderedCents) || changeCents !== 0) {
    throw new InvalidPaymentError({method: 'mixed', tenderedCents, changeCents});
  }
  const split = splitParts(parsed, tenderedCents);
  return new Payment({method: 'mixed', tenderedCents, changeCents: 0, parts: split});
}

/**
 * @param {string} raw
 * @returns {Array<{method: string, amountCents: number}>}
 */
function parseParts(raw) {
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    throw new InvalidPaymentError({method: 'mixed'});
  }
}

/**
 * @param {*} value
 * @param {string} method
 * @returns {Money}
 */
function moneyOf(value, method) {
  try {
    return Money.from(value);
  } catch (error) {
    throw new InvalidPaymentError({method});
  }
}
