import * as Rx from 'rxjs';
import ShopProfile from '../../domain/shop/ShopProfile';
import ShopProfileView from '../../domain/shop/ShopProfileView';
import TaxId from '../../domain/shop/TaxId';
import {rethrow} from '../logging/ErrorLog';
/** @typedef {import('../../domain/shop/ShopProfileRepository').default} ShopProfileRepository */
/** @typedef {import('../../domain/shop/ShopProfileQuery').default} ShopProfileQuery */

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

  /**
   * One row. `query` has no fields, so it does not change the read.
   * @param {ShopProfileQuery} query
   * @returns {import('rxjs/Observable').Observable<ShopProfileView>}
   */
  find(query) {
    return this._load(viewFromJson, () => new ShopProfileView({}));
  }

  /** @returns {import('rxjs/Observable').Observable<ShopProfile>} */
  findProfile() {
    return this._load(profileFromJson, () => ShopProfile.empty());
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

  _load(present, missing) {
    return Rx.Observable.defer(() => {
      const row = this._database.prepare(FIND_SQL).get(KEY);
      return Rx.Observable.of(row ? present(row.value_json) : missing());
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
 * @returns {ShopProfileView}
 */
function viewFromJson(text) {
  const data = JSON.parse(text);
  const address = data.address || {};
  return new ShopProfileView({
    nif: data.nif,
    legalName: data.legalName,
    tradeName: data.tradeName,
    street: address.street,
    postalCode: address.postalCode,
    city: address.city,
    province: address.province,
    country: address.country,
    timeZone: data.timeZone,
    invoicingEnabled: data.invoicingEnabled
  });
}

/**
 * @param {string} text
 * @returns {ShopProfile}
 */
function profileFromJson(text) {
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
