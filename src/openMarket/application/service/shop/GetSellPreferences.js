import {Observable} from 'rxjs/Observable';
import 'rxjs/add/observable/defer';
import SellPreferencesQuery from '../../../domain/shop/SellPreferencesQuery';
/** @typedef {import('../../../domain/shop/SellPreferencesRepository').default} SellPreferencesRepository */
/** @typedef {import('../../../domain/shop/SellPreferencesView').default} SellPreferencesView */

/**
 * Reads how the till prints a ticket: the mode, the copy, and the paper width.
 */
export default class GetSellPreferences {

  /** @param {{sellPreferencesRepository: SellPreferencesRepository}} deps */
  constructor({sellPreferencesRepository}) {
    this._sellPreferencesRepository = sellPreferencesRepository;
  }

  /** @returns {import('rxjs/Observable').Observable<SellPreferencesView>} */
  get() {
    return Observable.defer(() => this._sellPreferencesRepository.find(new SellPreferencesQuery()));
  }

}
