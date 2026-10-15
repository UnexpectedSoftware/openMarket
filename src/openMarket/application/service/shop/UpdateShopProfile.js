import * as Rx from 'rxjs';
import TaxId from '../../../domain/shop/TaxId';
import ShopProfile from '../../../domain/shop/ShopProfile';
import ShopProfileIncompleteError from '../../../domain/shop/ShopProfileIncompleteError';
import observableError from '../../../infrastructure/logging/observableError';
/** @import ShopProfileRepository from '../../../domain/shop/ShopProfileRepository' */

/**
 * Saves the shop profile from the Settings screen.
 */
export default class UpdateShopProfile {

  /** @param {{shopProfileRepository: ShopProfileRepository}} deps */
  constructor({shopProfileRepository}) {
    this._shopProfileRepository = shopProfileRepository;
  }

  /**
   * @param {object} command
   * @param {string} [command.nif]
   * @param {string} [command.legalName]
   * @param {string} [command.tradeName]
   * @param {string} [command.street]
   * @param {string} [command.postalCode]
   * @param {string} [command.city]
   * @param {string} [command.province]
   * @param {string} [command.country]
   * @param {boolean} [command.invoicingEnabled]
   * @returns {import('rxjs/Observable').Observable<ShopProfile>}
   */
  update(command) {
    return Rx.Observable.defer(() => {
      let nif = null;
      const rawNif = command.nif == null ? '' : String(command.nif).trim();
      if (rawNif !== '') {
        try {
          nif = TaxId.parse(rawNif);
        } catch (error) {
          return observableError(error);
        }
      }
      const legalName = command.legalName == null ? '' : String(command.legalName).trim();
      const invoicingEnabled = Boolean(command.invoicingEnabled);
      if (invoicingEnabled && (nif == null || legalName === '')) {
        return observableError(new ShopProfileIncompleteError());
      }
      const profile = new ShopProfile({
        nif,
        legalName,
        tradeName: command.tradeName,
        address: {
          street: command.street || '',
          postalCode: command.postalCode || '',
          city: command.city || '',
          province: command.province || '',
          country: command.country || 'ES'
        },
        timeZone: 'Europe/Madrid',
        invoicingEnabled
      });
      return this._shopProfileRepository.save({profile});
    });
  }

}
