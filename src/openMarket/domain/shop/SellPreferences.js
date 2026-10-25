import InvalidSellPreferencesError from './InvalidSellPreferencesError';

const COPY_MAX = 80;

/**
 * Till behaviour that is not part of the shop's fiscal profile.
 * Printing asks by default, on 80 mm paper, with no extra header or footer.
 */
export default class SellPreferences {

  /** @returns {SellPreferences} */
  static defaults() {
    return new SellPreferences({});
  }

  /**
   * @param {object} [props]
   * @param {string} [props.printMode]
   * @param {string} [props.headerText]
   * @param {string} [props.footerText]
   * @param {number} [props.paperWidthMm]
   */
  constructor({printMode, headerText, footerText, paperWidthMm} = {}) {
    /** @private */
    this._printMode = printMode === undefined ? 'ask' : requiredMode(printMode);
    /** @private */
    this._headerText = requiredCopy(headerText, 'headerText');
    /** @private */
    this._footerText = requiredCopy(footerText, 'footerText');
    /** @private */
    this._paperWidthMm = paperWidthMm === undefined ? 80 : requiredWidth(paperWidthMm);
  }

  /** @returns {'always' | 'ask' | 'never'} */
  get printMode() {
    return this._printMode;
  }

  /** @returns {string} */
  get headerText() {
    return this._headerText;
  }

  /** @returns {string} */
  get footerText() {
    return this._footerText;
  }

  /** @returns {58 | 80} */
  get paperWidthMm() {
    return this._paperWidthMm;
  }

  /**
   * @param {string} printMode
   * @returns {SellPreferences}
   */
  withPrintMode(printMode) {
    return new SellPreferences({
      printMode,
      headerText: this._headerText,
      footerText: this._footerText,
      paperWidthMm: this._paperWidthMm
    });
  }

  /**
   * @param {{headerText: string, footerText: string}} copy
   * @returns {SellPreferences}
   */
  withCopy({headerText, footerText}) {
    return new SellPreferences({
      printMode: this._printMode,
      headerText,
      footerText,
      paperWidthMm: this._paperWidthMm
    });
  }

  /**
   * @param {number} paperWidthMm
   * @returns {SellPreferences}
   */
  withPaperWidth(paperWidthMm) {
    return new SellPreferences({
      printMode: this._printMode,
      headerText: this._headerText,
      footerText: this._footerText,
      paperWidthMm
    });
  }

}

/**
 * @param {string} printMode
 * @returns {'always' | 'ask' | 'never'}
 */
function requiredMode(printMode) {
  if (printMode === 'always' || printMode === 'ask' || printMode === 'never') {
    return printMode;
  }
  throw new InvalidSellPreferencesError({field: 'printMode', value: printMode});
}

/**
 * @param {string | null | undefined} value
 * @param {string} field
 * @returns {string}
 */
function requiredCopy(value, field) {
  const text = value == null ? '' : String(value).trim();
  if (text.length > COPY_MAX) {
    throw new InvalidSellPreferencesError({field, value: text});
  }
  return text;
}

/**
 * @param {number} paperWidthMm
 * @returns {58 | 80}
 */
function requiredWidth(paperWidthMm) {
  if (paperWidthMm === 58 || paperWidthMm === 80) {
    return paperWidthMm;
  }
  throw new InvalidSellPreferencesError({field: 'paperWidthMm', value: paperWidthMm});
}
