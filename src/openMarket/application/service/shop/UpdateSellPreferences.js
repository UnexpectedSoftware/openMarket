import 'rxjs/add/operator/mergeMap';
/** @typedef {import('../../../domain/shop/SellPreferencesRepository').default} SellPreferencesRepository */
/** @typedef {import('../../../domain/shop/SellPreferences').default} SellPreferences */

/**
 * Stores the till's auto-print choice. The Settings screen is a later phase.
 */
export default class UpdateSellPreferences {

  /** @param {{sellPreferencesRepository: SellPreferencesRepository}} deps */
  constructor({sellPreferencesRepository}) {
    this._sellPreferencesRepository = sellPreferencesRepository;
  }

  /**
   * @param {{autoPrint?: boolean}} command
   * @returns {import('rxjs/Observable').Observable<SellPreferences>}
   */
  update({autoPrint}) {
    return this._sellPreferencesRepository.findPreferences()
      .flatMap(preferences => this._sellPreferencesRepository.save({
        preferences: preferences.withAutoPrint(autoPrint === true)
      }));
  }

}
