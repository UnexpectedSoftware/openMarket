import * as Rx from 'rxjs';
import ShopProfile from '../../domain/shop/ShopProfile';
import TaxId from '../../domain/shop/TaxId';
import {rethrow} from '../logging/ErrorLog';
/** @typedef {import('../../domain/shop/ShopProfileRepository').default} ShopProfileRepository */

const KEY = 'shop_profile';
const FIND_SQL = 'SELECT value_json FROM setting WHERE key = ?';
const SAVE_SQL = 'INSERT INTO setting (key, value_json) VALUES (?, ?) ' +
  'ON CONFLICT(key) DO UPDATE SET value_json = excluded.value_json';

/**
 * The shop profile stored as one JSON setting.
 * @implements {ShopProfileRepository}
 */
export default class SqliteShopProfileRepository {

  /**
   * @param {{connection: {database: any}}} deps
   */
  constructor({connection}) {
    this._database = connection.database;
  }

  /** @returns {import('rxjs/Observable').Observable<ShopProfile>} */
  find() {
    return Rx.Observable.defer(() => {
      const row = this._database.prepare(FIND_SQL).get(KEY);
      if (!row) {
        return Rx.Observable.of(ShopProfile.empty());
      }
      return Rx.Observable.of(fromJson(row.value_json));
    });
  }

  /**
   * @param {{profile: ShopProfile}} params
   * @returns {import('rxjs/Observable').Observable<ShopProfile>}
   */
  save({profile}) {
    return Rx.Observable.defer(() => {
      try {
        this._database.prepare(SAVE_SQL).run(KEY, JSON.stringify(toJson(profile)));
      } catch (error) {
        rethrow(error, {message: 'Could not save the shop profile', context: {operation: 'save'}});
      }
      return Rx.Observable.of(profile);
    });
  }

}

/**
 * @param {ShopProfile} profile
 * @returns {object}
 */
function toJson(profile) {
  return {
    nif: profile.nif ? profile.nif.value : null,
    legalName: profile.legalName,
    tradeName: profile.tradeName,
    address: profile.address,
    timeZone: profile.timeZone,
    invoicingEnabled: profile.invoicingEnabled
  };
}

/**
 * @param {string} text
 * @returns {ShopProfile}
 */
function fromJson(text) {
  const data = JSON.parse(text);
  return new ShopProfile({
    nif: data.nif ? TaxId.parse(data.nif) : null,
    legalName: data.legalName,
    tradeName: data.tradeName,
    address: data.address,
    timeZone: data.timeZone,
    invoicingEnabled: data.invoicingEnabled
  });
}
