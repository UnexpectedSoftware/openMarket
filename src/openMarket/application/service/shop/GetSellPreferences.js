import {Observable} from 'rxjs/Observable';
import 'rxjs/add/observable/defer';
/** @import SellPreferencesRepository from '../../../domain/shop/SellPreferencesRepository' */
/** @import SellPreferences from '../../../domain/shop/SellPreferences' */

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
