import * as Rx from 'rxjs';
import 'rxjs/add/observable/merge';
import 'rxjs/add/observable/of';
import 'rxjs/add/operator/catch';
import 'rxjs/add/operator/filter';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/mergeMap';
import {userText} from '../../infrastructure/logging/ErrorLog';
import {
  SHOP_PROFILE_REQUESTED,
  SHOP_PROFILE_SAVE_REQUESTED,
  shopProfileFailed,
  shopProfileLoaded,
  shopProfileSaved
} from './action';

/**
 * Fields the flat settings reducer already stores, copied off a ShopProfileView.
 * @param {object} view
 * @returns {object}
 */
function fieldsOf(view) {
  return {
    nif: view.nif || '',
    legalName: view.legalName,
    tradeName: view.tradeName,
    street: view.street,
    postalCode: view.postalCode,
    city: view.city,
    province: view.province,
    country: view.country,
    invoicingEnabled: view.invoicingEnabled,
    issuer: view.issuer
  };
}

/**
 * @param {{getShopProfile: {getProfile: Function}, updateShopProfile: {update: Function}}} deps
 */
export function makeShopProfileEpic({getShopProfile, updateShopProfile}) {
  const load = action$ => action$
    .filter(action => action.type === SHOP_PROFILE_REQUESTED)
    .flatMap(() => getShopProfile.getProfile()
      .map(view => shopProfileLoaded(fieldsOf(view)))
      .catch(error => Rx.Observable.of(shopProfileFailed(userText(error, 'Shop settings could not be loaded')))));

  const save = action$ => action$
    .filter(action => action.type === SHOP_PROFILE_SAVE_REQUESTED)
    .flatMap(action => updateShopProfile.update(action.command)
      .flatMap(() => getShopProfile.getProfile())
      .map(view => shopProfileSaved(fieldsOf(view)))
      .catch(error => Rx.Observable.of(shopProfileFailed(userText(error, 'Shop settings were not saved')))));

  return action$ => Rx.Observable.merge(load(action$), save(action$));
}
