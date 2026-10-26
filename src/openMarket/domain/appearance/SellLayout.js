import InvalidSellLayoutError from './InvalidSellLayoutError';

const DEFAULT_ID = 'mostrador';

const IDS = Object.freeze([
  DEFAULT_ID,
  'escaner',
  'tactil'
]);

/**
 * One sell-screen preset. Mostrador is the two-column counter.
 * Escáner is the keyboard-first search. Táctil is the large-tile counter.
 */
export default class SellLayout {

  /**
   * @param {string} id
   * @returns {SellLayout}
   */
  static of(id) {
    return new SellLayout(id);
  }

  /**
   * Mostrador, the layout used when a till has never chosen one.
   * @returns {SellLayout}
   */
  static get DEFAULT() {
    return new SellLayout(DEFAULT_ID);
  }

  /** @returns {string[]} */
  static ids() {
    return IDS.slice();
  }

  /**
   * A known id, or Mostrador when the stored value is missing or unknown.
   * The view may keep an unknown string; the screen paints a real preset.
   * @param {string | null | undefined} id
   * @returns {string}
   */
  static orDefault(id) {
    const value = id == null ? '' : String(id);
    if (IDS.indexOf(value) === -1) {
      return DEFAULT_ID;
    }
    return value;
  }

  /**
   * @param {string} id
   */
  constructor(id) {
    const value = id == null ? '' : String(id);
    if (IDS.indexOf(value) === -1) {
      throw new InvalidSellLayoutError({layout: value});
    }
    this._id = value;
  }

  /** @returns {string} */
  get id() {
    return this._id;
  }

  /**
   * @param {SellLayout | string | null | undefined} other
   * @returns {boolean}
   */
  equals(other) {
    const value = other instanceof SellLayout ? other.id : other;
    return value === this._id;
  }

}
