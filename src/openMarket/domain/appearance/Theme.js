import InvalidThemeError from './InvalidThemeError';

const IDS = Object.freeze([
  'mercado',
  'mostrador-noche',
  'ultramarinos',
  'unexpected-neon'
]);

/**
 * One of the installed colour themes. The id is the `data-theme` value.
 */
export default class Theme {

  /**
   * @param {string} id
   * @returns {Theme}
   */
  static of(id) {
    return new Theme(id);
  }

  /**
   * Mercado, the theme used when a till has never chosen one.
   * @returns {Theme}
   */
  static get DEFAULT() {
    return new Theme('mercado');
  }

  /** @returns {string[]} */
  static ids() {
    return IDS.slice();
  }

  /**
   * @param {string} id
   */
  constructor(id) {
    const value = id == null ? '' : String(id);
    if (IDS.indexOf(value) === -1) {
      throw new InvalidThemeError({theme: value});
    }
    this._id = value;
  }

  /** @returns {string} */
  get id() {
    return this._id;
  }

  /**
   * @param {Theme | string} other
   * @returns {boolean}
   */
  equals(other) {
    const value = other instanceof Theme ? other.id : other;
    return value === this._id;
  }

}
