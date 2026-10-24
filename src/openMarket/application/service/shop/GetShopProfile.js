import {Observable} from 'rxjs/Observable';
import 'rxjs/add/observable/defer';
import ShopProfileQuery from '../../../domain/shop/ShopProfileQuery';
/** @typedef {import('../../../domain/shop/ShopProfileRepository').default} ShopProfileRepository */
/** @typedef {import('../../../domain/shop/ShopProfileView').default} ShopProfileView */

/**
 * Reads the shop profile for Settings and for the sale screen.
 */
export default class GetShopProfile {

  /** @param {{shopProfileRepository: ShopProfileRepository}} deps */
  constructor({shopProfileRepository}) {
    this._shopProfileRepository = shopProfileRepository;
  }

  /** @returns {import('rxjs/Observable').Observable<ShopProfileView>} */
  getProfile() {
    return Observable.defer(() => this._shopProfileRepository.find(new ShopProfileQuery()));
  }

}
