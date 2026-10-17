import {Observable} from 'rxjs/Observable';
import 'rxjs/add/observable/defer';
/** @import AppearancePreferencesRepository from '../../../domain/appearance/AppearancePreferencesRepository' */
/** @import AppearancePreferences from '../../../domain/appearance/AppearancePreferences' */

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
