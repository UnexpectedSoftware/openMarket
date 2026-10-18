/** @template T @typedef {import('rxjs/Observable').Observable<T>} Observable */
/** @typedef {import('./ShopProfile').default} ShopProfile */

/**
 * Port: the single shop profile.
 * @interface
 */
export default class ShopProfileRepository {

  /**
   * The stored profile, or an empty one when settings have never been saved.
   * @returns {Observable<ShopProfile>}
   */
  find() {
    throw new Error('ShopProfileRepository#find must be implemented');
  }

  /**
   * @param {{profile: ShopProfile}} params
   * @returns {Observable<ShopProfile>}
   */
  save({profile}) {
    throw new Error('ShopProfileRepository#save must be implemented');
  }

}
