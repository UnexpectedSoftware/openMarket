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
 * @param {object} profile
 * @returns {object}
 */
export function shopProfileView(profile) {
  const address = profile.address || {};
  return {
    nif: profile.nif ? profile.nif.value : '',
    legalName: profile.legalName || '',
    tradeName: profile.tradeName || '',
    street: address.street || '',
    postalCode: address.postalCode || '',
    city: address.city || '',
    province: address.province || '',
    country: address.country || 'ES',
    invoicingEnabled: profile.invoicingEnabled === true,
    issuer: typeof profile.snapshot === 'function' ? profile.snapshot() : null
  };
}

/**
 * @param {{getShopProfile: {getProfile: Function}, updateShopProfile: {update: Function}}} deps
 */
export function makeShopProfileEpic({getShopProfile, updateShopProfile}) {
  const load = action$ => action$
    .filter(action => action.type === SHOP_PROFILE_REQUESTED)
    .flatMap(() => getShopProfile.getProfile()
      .map(profile => shopProfileLoaded(shopProfileView(profile)))
      .catch(error => Rx.Observable.of(shopProfileFailed(userText(error, 'Shop settings could not be loaded')))));

  const save = action$ => action$
    .filter(action => action.type === SHOP_PROFILE_SAVE_REQUESTED)
    .flatMap(action => updateShopProfile.update(action.command)
      .map(profile => shopProfileSaved(shopProfileView(profile)))
      .catch(error => Rx.Observable.of(shopProfileFailed(userText(error, 'Shop settings were not saved')))));

  return action$ => Rx.Observable.merge(load(action$), save(action$));
}
