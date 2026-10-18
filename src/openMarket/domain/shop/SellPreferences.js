/**
 * Till behaviour that is not part of the shop's fiscal profile.
 * Auto-print defaults to off, so a sale asks before it prints.
 */
export default class SellPreferences {

  /** @returns {SellPreferences} */
  static defaults() {
    return new SellPreferences({autoPrint: false});
  }

  /**
   * @param {{autoPrint?: boolean}} [props]
   */
  constructor({autoPrint} = {}) {
    /** @private */
    this._autoPrint = autoPrint === true;
  }

  /** @returns {boolean} */
  get autoPrint() {
    return this._autoPrint;
  }

  /**
   * @param {boolean} autoPrint
   * @returns {SellPreferences}
   */
  withAutoPrint(autoPrint) {
    return new SellPreferences({autoPrint});
  }

}
