/**
 * An invoice was issued. The public payload is schema version 1.
 * A stored row with no schemaVersion is version 0 and is not rewritten.
 */
export default class InvoiceIssued {

  static get type() {
    return 'InvoiceIssued';
  }

  /**
   * Stored even before a durable subscriber exists.
   * @returns {boolean}
   */
  static get durable() {
    return true;
  }

  /** @returns {number} */
  static get schemaVersion() {
    return 1;
  }

  /**
   * @param {*} payload Version 1 payload, or a version 0 row
   */
  constructor(payload) {
    const source = payload || {};
    const body = source.schemaVersion == null ? legacyIssued(source) : clone(source);
    Object.assign(this, freeze(body));
  }

}

/**
 * Rows saved before schema version 1. Subscribers registered after that release
 * do not receive them: delivery skips events stored before registration.
 * @param {*} payload
 * @returns {object}
 */
function legacyIssued(payload) {
  return {
    schemaVersion: 0,
    id: payload.id,
    series: payload.series,
    number: payload.number,
    invoiceNumber: payload.invoiceNumber,
    issuedAt: payload.issuedAt,
    orderId: payload.orderId == null ? null : payload.orderId,
    lines: payload.lines || [],
    total: payload.total,
    totalCents: payload.totalCents == null ? null : payload.totalCents
  };
}

/**
 * @param {object} value
 * @returns {object}
 */
function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

/**
 * @param {*} value
 * @returns {*}
 */
function freeze(value) {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value);
    Object.keys(value).forEach(key => freeze(value[key]));
  }
  return value;
}
