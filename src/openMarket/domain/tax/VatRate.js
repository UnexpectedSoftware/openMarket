import InvalidVatRateError from './InvalidVatRateError';

const PERCENTS = [21, 10, 5, 4, 2, 0];
const EXEMPTION_CAUSES = ['E1', 'E2', 'E3', 'E4', 'E5', 'E6'];
const NOT_SUBJECT_CAUSES = ['N1', 'N2'];

/**
 * A VAT rate snapshotted onto a product and onto each sold line.
 * Prices stay VAT-included. `kind` is S1 (taxed), E (exempt) or N (not subject).
 */
export default class VatRate {

  /**
   * @param {{percent?: number | string | null, kind?: string | null, cause?: string | null, exemption?: string | null}} value
   * @returns {VatRate}
   */
  static of({percent, kind, cause, exemption} = {}) {
    const resolvedKind = kind == null || kind === '' ? 'S1' : String(kind);
    const resolvedCause = cause == null || cause === '' ? (exemption || null) : String(cause);
    const resolvedPercent = percent == null || percent === '' ? (resolvedKind === 'S1' ? 21 : 0) : Number(percent);
    if (!Number.isInteger(resolvedPercent) || PERCENTS.indexOf(resolvedPercent) === -1) {
      throw new InvalidVatRateError({kind: resolvedKind, percent, cause: resolvedCause});
    }
    if (resolvedKind === 'S1') {
      if (resolvedCause != null) {
        throw new InvalidVatRateError({kind: resolvedKind, percent: resolvedPercent, cause: resolvedCause});
      }
      return new VatRate({kind: 'S1', percent: resolvedPercent, cause: null});
    }
    if (resolvedKind === 'E') {
      if (resolvedPercent !== 0 || EXEMPTION_CAUSES.indexOf(resolvedCause) === -1) {
        throw new InvalidVatRateError({kind: resolvedKind, percent: resolvedPercent, cause: resolvedCause});
      }
      return new VatRate({kind: 'E', percent: 0, cause: resolvedCause});
    }
    if (resolvedKind === 'N') {
      if (resolvedPercent !== 0 || NOT_SUBJECT_CAUSES.indexOf(resolvedCause) === -1) {
        throw new InvalidVatRateError({kind: resolvedKind, percent: resolvedPercent, cause: resolvedCause});
      }
      return new VatRate({kind: 'N', percent: 0, cause: resolvedCause});
    }
    throw new InvalidVatRateError({kind: resolvedKind, percent: resolvedPercent, cause: resolvedCause});
  }

  /**
   * @param {number} [percent]
   * @returns {VatRate}
   */
  static standard(percent = 21) {
    return VatRate.of({kind: 'S1', percent});
  }

  /**
   * @param {*} value A VatRate, a column triple, or a `kind:percent[:cause]` code.
   * @returns {VatRate}
   */
  static from(value) {
    if (value instanceof VatRate) {
      return value;
    }
    if (typeof value === 'string') {
      return VatRate.fromCode(value);
    }
    if (value != null && typeof value === 'object') {
      return VatRate.of(value);
    }
    throw new InvalidVatRateError();
  }

  /**
   * @param {string} code
   * @returns {VatRate}
   */
  static fromCode(code) {
    const parts = String(code == null ? '' : code).split(':');
    if (parts.length < 2) {
      throw new InvalidVatRateError({kind: code});
    }
    return VatRate.of({
      kind: parts[0],
      percent: Number(parts[1]),
      cause: parts[2] || null
    });
  }

  /**
   * Rates the product form can offer.
   * @returns {Array<{code: string, label: string}>}
   */
  static options() {
    const taxed = PERCENTS.map(percent => ({
      code: 'S1:' + percent,
      label: percent + ' %'
    }));
    const exempt = EXEMPTION_CAUSES.map(cause => ({
      code: 'E:0:' + cause,
      label: 'Exento ' + cause
    }));
    const notSubject = NOT_SUBJECT_CAUSES.map(cause => ({
      code: 'N:0:' + cause,
      label: 'No sujeto ' + cause
    }));
    return taxed.concat(exempt).concat(notSubject);
  }

  /**
   * @param {{kind: string, percent: number, cause: string | null}} props
   */
  constructor({kind, percent, cause}) {
    /** @type {'S1' | 'E' | 'N'} */
    this._kind = /** @type {'S1' | 'E' | 'N'} */ (kind);
    this._percent = percent;
    this._cause = cause;
  }

  /** @returns {'S1' | 'E' | 'N'} */
  get kind() {
    return this._kind;
  }

  /** @returns {number} */
  get percent() {
    return this._percent;
  }

  /** @returns {string | null} */
  get cause() {
    return this._cause;
  }

  /** @returns {string} */
  code() {
    return this._cause == null
      ? this._kind + ':' + this._percent
      : this._kind + ':' + this._percent + ':' + this._cause;
  }

  /**
   * Group key for a VAT breakdown.
   * @returns {string}
   */
  key() {
    return this.code();
  }

  /**
   * @param {VatRate} other
   * @returns {boolean}
   */
  equals(other) {
    return other instanceof VatRate && other.key() === this.key();
  }

  /**
   * @returns {{kind: string, percent: number, cause: string | null}}
   */
  toJSON() {
    return {kind: this._kind, percent: this._percent, cause: this._cause};
  }

}
