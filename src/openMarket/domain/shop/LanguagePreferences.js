import InvalidLanguageError from './InvalidLanguageError';

/**
 * The till's locale. The only accepted value is `es`.
 */
export default class LanguagePreferences {

  /** @returns {LanguagePreferences} */
  static defaults() {
    return new LanguagePreferences({});
  }

  /**
   * @param {{locale?: string}} [props]
   */
  constructor({locale} = {}) {
    /** @private */
    this._locale = locale === undefined ? 'es' : requiredLocale(locale);
  }

  /** @returns {'es'} */
  get locale() {
    return this._locale;
  }

  /**
   * @param {string} locale
   * @returns {LanguagePreferences}
   */
  withLocale(locale) {
    return new LanguagePreferences({locale});
  }

}

/**
 * @param {string} locale
 * @returns {'es'}
 */
function requiredLocale(locale) {
  if (locale !== 'es') {
    throw new InvalidLanguageError({locale});
  }
  return locale;
}
