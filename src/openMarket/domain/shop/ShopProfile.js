import TaxId from './TaxId';

/**
 * The shop that issues invoices. One profile for the whole database.
 */
export default class ShopProfile {

  /**
   * @returns {ShopProfile}
   */
  static empty() {
    return new ShopProfile({
      nif: null,
      legalName: '',
      tradeName: '',
      address: emptyAddress(),
      timeZone: 'Europe/Madrid',
      invoicingEnabled: false
    });
  }

  /**
   * @param {object} props
   * @param {TaxId | null} props.nif
   * @param {string} props.legalName
   * @param {string} [props.tradeName]
   * @param {{street?: string, postalCode?: string, city?: string, province?: string, country?: string}} [props.address]
   * @param {string} [props.timeZone]
   * @param {boolean} [props.invoicingEnabled]
   */
  constructor({nif, legalName, tradeName, address, timeZone, invoicingEnabled}) {
    this._nif = nif instanceof TaxId ? nif : null;
    this._legalName = legalName == null ? '' : String(legalName);
    this._tradeName = tradeName == null ? '' : String(tradeName);
    this._address = {...emptyAddress(), ...(address || {})};
    this._timeZone = timeZone || 'Europe/Madrid';
    this._invoicingEnabled = Boolean(invoicingEnabled);
  }

  /** @returns {TaxId | null} */
  get nif() {
    return this._nif;
  }

  /** @returns {string} */
  get legalName() {
    return this._legalName;
  }

  /** @returns {string} */
  get tradeName() {
    return this._tradeName;
  }

  /** @returns {{street: string, postalCode: string, city: string, province: string, country: string}} */
  get address() {
    return {...this._address};
  }

  /** @returns {string} */
  get timeZone() {
    return this._timeZone;
  }

  /** @returns {boolean} */
  get invoicingEnabled() {
    return this._invoicingEnabled;
  }

  /**
   * A sale can name the issuer only when the NIF and the legal name are set.
   * @returns {boolean}
   */
  isComplete() {
    return this._nif != null && this._legalName.trim() !== '';
  }

  /**
   * Values copied onto an invoice. Null until the profile is complete.
   * @returns {{nif: string, legalName: string, tradeName: string | null, address: {street: string, postalCode: string, city: string, province: string, country: string}} | null}
   */
  snapshot() {
    if (!this.isComplete()) {
      return null;
    }
    return {
      nif: this._nif.value,
      legalName: this._legalName,
      tradeName: this._tradeName || null,
      address: this.address
    };
  }

}

function emptyAddress() {
  return {street: '', postalCode: '', city: '', province: '', country: 'ES'};
}
