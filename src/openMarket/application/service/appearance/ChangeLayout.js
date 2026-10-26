import 'rxjs/add/operator/mergeMap';
import observableError from '../../../infrastructure/logging/observableError';
/** @typedef {import('../../../domain/appearance/AppearancePreferencesRepository').default} AppearancePreferencesRepository */
/** @typedef {import('../../../domain/appearance/AppearancePreferences').default} AppearancePreferences */

/**
 * Stores the sell-screen preset the cashier picked on this till.
 */
export default class ChangeLayout {

  /** @param {{appearancePreferencesRepository: AppearancePreferencesRepository}} deps */
  constructor({appearancePreferencesRepository}) {
    this._appearancePreferencesRepository = appearancePreferencesRepository;
  }

  /**
   * @param {{layout: string}} command
   * @returns {import('rxjs/Observable').Observable<AppearancePreferences>}
   */
  changeLayout({layout}) {
    return this._appearancePreferencesRepository.findPreferences().flatMap(preferences => {
      try {
        preferences.changeLayout({layout});
      } catch (error) {
        return observableError(error);
      }
      return this._appearancePreferencesRepository.save({preferences});
    });
  }

}
