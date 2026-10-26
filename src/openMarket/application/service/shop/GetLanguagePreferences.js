import {Observable} from 'rxjs/Observable';
import 'rxjs/add/observable/defer';
import LanguagePreferencesQuery from '../../../domain/shop/LanguagePreferencesQuery';
/** @typedef {import('../../../domain/shop/LanguagePreferencesRepository').default} LanguagePreferencesRepository */
/** @typedef {import('../../../domain/shop/LanguagePreferencesView').default} LanguagePreferencesView */

/**
 * Reads the till's locale. The only value this screen stores is `es`.
 */
export default class GetLanguagePreferences {

  /** @param {{languagePreferencesRepository: LanguagePreferencesRepository}} deps */
  constructor({languagePreferencesRepository}) {
    this._languagePreferencesRepository = languagePreferencesRepository;
  }

  /** @returns {import('rxjs/Observable').Observable<LanguagePreferencesView>} */
  get() {
    return Observable.defer(() => this._languagePreferencesRepository.find(new LanguagePreferencesQuery()));
  }

}
