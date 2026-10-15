import {Observable} from 'rxjs/Observable';
import 'rxjs/add/observable/defer';
/** @import ShopProfileRepository from '../../../domain/shop/ShopProfileRepository' */
/** @import ShopProfile from '../../../domain/shop/ShopProfile' */

/**
 * Reads the shop profile for Settings and for the sale screen.
 */
export default class GetShopProfile {

  /** @param {{shopProfileRepository: ShopProfileRepository}} deps */
  constructor({shopProfileRepository}) {
    this._shopProfileRepository = shopProfileRepository;
  }

  /** @returns {import('rxjs/Observable').Observable<ShopProfile>} */
  getProfile() {
    return Observable.defer(() => this._shopProfileRepository.find());
  }

}
