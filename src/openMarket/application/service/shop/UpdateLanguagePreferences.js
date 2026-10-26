import 'rxjs/add/operator/mergeMap';
/** @typedef {import('../../../domain/shop/LanguagePreferencesRepository').default} LanguagePreferencesRepository */
/** @typedef {import('../../../domain/shop/LanguagePreferences').default} LanguagePreferences */

/**
 * Stores the till's locale. Anything other than `es` fails with `LANGUAGE_INVALID`.
 */
export default class UpdateLanguagePreferences {

  /** @param {{languagePreferencesRepository: LanguagePreferencesRepository}} deps */
  constructor({languagePreferencesRepository}) {
    this._languagePreferencesRepository = languagePreferencesRepository;
  }

  /**
   * @param {{locale: string}} command
   * @returns {import('rxjs/Observable').Observable<LanguagePreferences>}
   */
  update({locale}) {
    return this._languagePreferencesRepository.findPreferences()
      .flatMap(preferences => this._languagePreferencesRepository.save({
        preferences: preferences.withLocale(locale)
      }));
  }

}
