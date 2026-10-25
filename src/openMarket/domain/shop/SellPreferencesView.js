/**
 * The till's sell preferences as stored, for a screen to read.
 * Defaults are ask, blank copy, and 80 mm paper. It does not construct a
 * `SellPreferences` and it does not check those values. The write aggregate
 * is `SellPreferences`.
 */
export default class SellPreferencesView {

  /**
   * @param {object} [props]
   * @param {string} [props.printMode]
   * @param {string} [props.headerText]
   * @param {string} [props.footerText]
   * @param {number} [props.paperWidthMm]
   */
  constructor({printMode = 'ask', headerText = '', footerText = '', paperWidthMm = 80} = {}) {
    this.printMode = printMode;
    this.headerText = headerText;
    this.footerText = footerText;
    this.paperWidthMm = paperWidthMm;
    Object.freeze(this);
  }

}
