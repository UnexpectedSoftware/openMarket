import issuerSnapshot from './issuerSnapshot';

/**
 * The shop profile as stored, for a screen to read. It carries the fields and
 * the issuer the sell screen shows. It does not construct a `ShopProfile`, it
 * does not call `isComplete`, and it does not check a NIF: a row already in
 * the database was valid when it was saved. The write aggregate is `ShopProfile`.
 */
export default class ShopProfileView {

  /**
   * @param {{nif?: string | null, legalName?: string | null, tradeName?: string | null, street?: string | null, postalCode?: string | null, city?: string | null, province?: string | null, country?: string | null, timeZone?: string | null, invoicingEnabled?: boolean, phone?: string | null, email?: string | null}} [props]
   */
  constructor({
    nif = null,
    legalName = '',
    tradeName = '',
    street = '',
    postalCode = '',
    city = '',
    province = '',
    country = 'ES',
    timeZone = 'Europe/Madrid',
    invoicingEnabled = false,
    phone = '',
    email = ''
  } = {}) {
    this.nif = blankToNull(nif);
    this.legalName = text(legalName, '');
    this.tradeName = text(tradeName, '');
    this.street = text(street, '');
    this.postalCode = text(postalCode, '');
    this.city = text(city, '');
    this.province = text(province, '');
    this.country = text(country, 'ES');
    this.timeZone = text(timeZone, 'Europe/Madrid');
    this.invoicingEnabled = invoicingEnabled === true;
    this.phone = text(phone, '');
    this.email = text(email, '');
    this.issuer = issuerSnapshot({
      nif: this.nif,
      legalName: this.legalName,
      tradeName: this.tradeName,
      address: {
        street: this.street,
        postalCode: this.postalCode,
        city: this.city,
        province: this.province,
        country: this.country
      }
    });
    if (this.issuer) {
      Object.freeze(this.issuer.address);
      Object.freeze(this.issuer);
    }
    Object.freeze(this);
  }

}

/**
 * @param {string | null | undefined} value
 * @param {string} fallback
 * @returns {string}
 */
function text(value, fallback) {
  if (value == null || value === '') {
    return fallback;
  }
  return String(value);
}

/**
 * A missing or blank NIF is null. Anything else is the trimmed string, unchecked.
 * @param {string | null | undefined} value
 * @returns {string | null}
 */
function blankToNull(value) {
  const trimmed = value == null ? '' : String(value).trim();
  if (trimmed === '') {
    return null;
  }
  return trimmed;
}
