import {Observable} from 'rxjs/Observable';
import 'rxjs/add/observable/defer';
/** @typedef {import('../../../domain/shop/SellPreferencesRepository').default} SellPreferencesRepository */
/** @typedef {import('../../../domain/shop/SellPreferences').default} SellPreferences */

/**
 * Reads whether the till prints a ticket as soon as the sale is saved.
 */
export default class GetSellPreferences {

  /** @param {{sellPreferencesRepository: SellPreferencesRepository}} deps */
  constructor({sellPreferencesRepository}) {
    this._sellPreferencesRepository = sellPreferencesRepository;
  }

  /** @returns {import('rxjs/Observable').Observable<SellPreferences>} */
  get() {
    return Observable.defer(() => this._sellPreferencesRepository.find());
  }

}
