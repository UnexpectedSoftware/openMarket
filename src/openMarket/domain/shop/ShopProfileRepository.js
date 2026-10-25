/** @template T @typedef {import('rxjs/Observable').Observable<T>} Observable */
/** @typedef {import('./ShopProfile').default} ShopProfile */
/** @typedef {import('./ShopProfileQuery').default} ShopProfileQuery */
/** @typedef {import('./ShopProfileView').default} ShopProfileView */

/**
 * Port: the single shop profile.
 * @interface
 */
export default class ShopProfileRepository {

  /**
   * The stored profile as a screen reads it. A missing row is the empty view.
   * It does not complete empty.
   * @param {ShopProfileQuery} query
   * @returns {Observable<ShopProfileView>}
   */
  find(query) {
    throw new Error('ShopProfileRepository#find must be implemented');
  }

  /**
   * The write aggregate, or an empty profile when settings have never been saved.
   * @returns {Observable<ShopProfile>}
   */
  findProfile() {
    throw new Error('ShopProfileRepository#findProfile must be implemented');
  }

  /**
   * @param {{profile: ShopProfile}} params
   * @returns {Observable<ShopProfile>}
   */
  save({profile}) {
    throw new Error('ShopProfileRepository#save must be implemented');
  }

}
