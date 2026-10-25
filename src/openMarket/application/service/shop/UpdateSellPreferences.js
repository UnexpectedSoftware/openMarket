import 'rxjs/add/operator/mergeMap';
/** @typedef {import('../../../domain/shop/SellPreferencesRepository').default} SellPreferencesRepository */
/** @typedef {import('../../../domain/shop/SellPreferences').default} SellPreferences */

/**
 * Stores how this till prints a ticket. A header or footer longer than 80
 * characters fails with `SELL_PREFERENCES_INVALID` on that field. The settings
 * screen maps that failure to "Máximo 80 caracteres".
 */
export default class UpdateSellPreferences {

  /** @param {{sellPreferencesRepository: SellPreferencesRepository}} deps */
  constructor({sellPreferencesRepository}) {
    this._sellPreferencesRepository = sellPreferencesRepository;
  }

  /**
   * @param {object} command
   * @param {string} command.printMode
   * @param {string} command.headerText
   * @param {string} command.footerText
   * @param {number} command.paperWidthMm
   * @returns {import('rxjs/Observable').Observable<SellPreferences>}
   */
  update({printMode, headerText, footerText, paperWidthMm}) {
    return this._sellPreferencesRepository.findPreferences()
      .flatMap(preferences => this._sellPreferencesRepository.save({
        preferences: preferences
          .withPrintMode(printMode)
          .withCopy({headerText, footerText})
          .withPaperWidth(paperWidthMm)
      }));
  }

}
