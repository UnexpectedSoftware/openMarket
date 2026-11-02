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
  constructor({printMode, headerText, footerText, paperWidthMm, templateId} = {}) {
    const template = chooseTemplate(templateId, paperWidthMm);
    /** @private */
    this._printMode = printMode === undefined ? 'ask' : requiredMode(printMode);
    /** @private */
    this._headerText = requiredCopy(headerText, 'headerText');
    /** @private */
    this._footerText = requiredCopy(footerText, 'footerText');
    /** @private */
    this._templateId = template.id;
    /** @private */
    this._paperWidthMm = template.width;
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

  /** @returns {'classic-80' | 'classic-58'} */
  get templateId() {
    return this._templateId;
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
      paperWidthMm: this._paperWidthMm,
      templateId: this._templateId
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
      paperWidthMm: this._paperWidthMm,
      templateId: this._templateId
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
 * A template selects the paper. A legacy width selects the matching template.
 * @param {string | null | undefined} templateId
 * @param {number | undefined} paperWidthMm
 * @returns {{id: 'classic-80' | 'classic-58', width: 58 | 80}}
 */
function chooseTemplate(templateId, paperWidthMm) {
  if (templateId === 'classic-58') {
    return {id: 'classic-58', width: 58};
  }
  if (templateId === 'classic-80') {
    return {id: 'classic-80', width: 80};
  }
  if (templateId != null && templateId !== '') {
    throw new InvalidSellPreferencesError({field: 'templateId', value: templateId});
  }
  if (paperWidthMm === undefined || paperWidthMm === 80) {
    return {id: 'classic-80', width: 80};
  }
  if (paperWidthMm === 58) {
    return {id: 'classic-58', width: 58};
  }
  throw new InvalidSellPreferencesError({field: 'paperWidthMm', value: paperWidthMm});
}
