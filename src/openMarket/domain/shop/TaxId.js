import InvalidTaxIdError from './InvalidTaxIdError';

const NIF_LETTERS = 'TRWAGMYFPDXBNJZSQVHLCKE';
const CIF_LETTERS = 'JABCDEFGHI';
const CIF_LETTER_ONLY = ['K', 'P', 'Q', 'S', 'N', 'W', 'R'];
const CIF_DIGIT_ONLY = ['A', 'B', 'E', 'H'];

/**
 * A Spanish tax id: NIF, NIE, or CIF. Stored in upper case with no spaces.
 */
export default class TaxId {

  /**
   * @param {string} value
   * @returns {TaxId}
   */
  static parse(value) {
    const normal = String(value == null ? '' : value).toUpperCase().replace(/[\s-]/g, '');
    if (/^\d{8}[A-Z]$/.test(normal) && letterFor(normal.slice(0, 8)) === normal[8]) {
      return new TaxId(normal);
    }
    if (/^[XYZ]\d{7}[A-Z]$/.test(normal)) {
      const replaced = String('XYZ'.indexOf(normal[0])) + normal.slice(1, 8);
      if (letterFor(replaced) === normal[8]) {
        return new TaxId(normal);
      }
    }
    if (/^[ABCDEFGHJNPQRSUVW]\d{7}[0-9A-J]$/.test(normal) && cifMatches(normal)) {
      return new TaxId(normal);
    }
    throw new InvalidTaxIdError({nif: normal || value});
  }

  /**
   * @param {string} value
   */
  constructor(value) {
    this._value = value;
  }

  /** @returns {string} */
  get value() {
    return this._value;
  }

  /**
   * @param {TaxId | string} other
   * @returns {boolean}
   */
  equals(other) {
    const value = other instanceof TaxId ? other.value : other;
    return value === this._value;
  }

}

/**
 * @param {string} digits
 * @returns {string}
 */
function letterFor(digits) {
  return NIF_LETTERS[Number(digits) % 23];
}

/**
 * @param {string} cif
 * @returns {boolean}
 */
function cifMatches(cif) {
  const digits = cif.slice(1, 8).split('').map(Number);
  let sum = 0;
  digits.forEach((digit, index) => {
    if (index % 2 === 0) {
      const doubled = digit * 2;
      sum += doubled > 9 ? doubled - 9 : doubled;
    } else {
      sum += digit;
    }
  });
  const control = (10 - (sum % 10)) % 10;
  const expectedDigit = String(control);
  const expectedLetter = CIF_LETTERS[control];
  const actual = cif[8];
  const kind = cif[0];
  if (CIF_LETTER_ONLY.indexOf(kind) !== -1) {
    return actual === expectedLetter;
  }
  if (CIF_DIGIT_ONLY.indexOf(kind) !== -1) {
    return actual === expectedDigit;
  }
  return actual === expectedDigit || actual === expectedLetter;
}
