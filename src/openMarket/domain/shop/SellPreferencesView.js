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
  constructor({printMode = 'ask', headerText = '', footerText = '', paperWidthMm = 80, templateId} = {}) {
    const narrow = templateId === 'classic-58' || (templateId == null && paperWidthMm === 58);
    this.printMode = printMode;
    this.headerText = headerText;
    this.footerText = footerText;
    this.templateId = narrow ? 'classic-58' : 'classic-80';
    this.paperWidthMm = narrow ? 58 : 80;
    Object.freeze(this);
  }

}
