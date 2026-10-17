import 'rxjs/add/operator/mergeMap';
import observableError from '../../../infrastructure/logging/observableError';
/** @import AppearancePreferencesRepository from '../../../domain/appearance/AppearancePreferencesRepository' */
/** @import AppearancePreferences from '../../../domain/appearance/AppearancePreferences' */

/**
 * Stores the theme the cashier picked on this till.
 */
export default class ChangeTheme {

  /** @param {{appearancePreferencesRepository: AppearancePreferencesRepository}} deps */
  constructor({appearancePreferencesRepository}) {
    this._appearancePreferencesRepository = appearancePreferencesRepository;
  }

  /**
   * @param {{theme: string}} command
   * @returns {import('rxjs/Observable').Observable<AppearancePreferences>}
   */
  changeTheme({theme}) {
    return this._appearancePreferencesRepository.find().flatMap(preferences => {
      try {
        preferences.changeTheme({theme});
      } catch (error) {
        return observableError(error);
      }
      return this._appearancePreferencesRepository.save({preferences});
    });
  }

}
