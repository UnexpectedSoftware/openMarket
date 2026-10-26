/**
 * The till's locale as stored, for a screen to read.
 * The default is `es`. It does not construct a `LanguagePreferences` and it
 * does not check the value. The write aggregate is `LanguagePreferences`.
 */
export default class LanguagePreferencesView {

  /**
   * @param {{locale?: string}} [props]
   */
  constructor({locale = 'es'} = {}) {
    this.locale = locale;
    Object.freeze(this);
  }

}
