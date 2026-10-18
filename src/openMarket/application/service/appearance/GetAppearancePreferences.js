import {Observable} from 'rxjs/Observable';
import 'rxjs/add/observable/defer';
/** @typedef {import('../../../domain/appearance/AppearancePreferencesRepository').default} AppearancePreferencesRepository */
/** @typedef {import('../../../domain/appearance/AppearancePreferences').default} AppearancePreferences */

/**
 * Reads the till theme before the first paint and for the Settings screen.
 */
export default class GetAppearancePreferences {

  /** @param {{appearancePreferencesRepository: AppearancePreferencesRepository}} deps */
  constructor({appearancePreferencesRepository}) {
    this._appearancePreferencesRepository = appearancePreferencesRepository;
  }

  /** @returns {import('rxjs/Observable').Observable<AppearancePreferences>} */
  get() {
    return Observable.defer(() => this._appearancePreferencesRepository.find());
  }

}
