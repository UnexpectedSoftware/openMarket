import * as Rx from 'rxjs';
import 'rxjs/add/observable/empty';
import 'rxjs/add/observable/from';
import 'rxjs/add/observable/merge';
import 'rxjs/add/observable/of';
import 'rxjs/add/operator/catch';
import 'rxjs/add/operator/exhaustMap';
import 'rxjs/add/operator/filter';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/mergeMap';
import 'rxjs/add/operator/switchMap';
import ErrorCode from '../../domain/error/ErrorCode';
import {record} from '../../infrastructure/logging/ErrorLog';
import {themeChanged, themeChangeFailed} from '../appearance/action';
import {toast} from '../components/toast';
import {
  SETTINGS_PAGE_OPENED,
  SETTINGS_SAVE_REQUESTED,
  SHOP_PROFILE_REQUESTED,
  settingsFailed,
  settingsLoaded,
  settingsSaved,
  settingsSaveFailed,
  shopProfileLoaded
} from './action';
import {
  LOAD_ERROR,
  NIF_INVALID,
  REQUIRED,
  SAVE_ERROR,
  THEME_SAVE_ERROR,
  copyFieldErrors,
  incompleteErrors,
  savePlan,
  state
} from './model';

const savedToast = () => toast.success('Ajustes guardados', 'Los cambios quedan guardados');

/**
 * Latest open wins. A sell-screen request refreshes the issuer and leaves the draft.
 * A page open also reads the ticket view.
 * @param {{getProfile: Function}} getShopProfile
 * @param {{get: Function}} [getSellPreferences]
 */
export function makeSettingsLoadEpic(getShopProfile, getSellPreferences) {
  return (action$, store) => action$
    .filter(isLoad)
    .switchMap(action => getShopProfile.getProfile()
      .flatMap(profile => ticketFor(action, getSellPreferences)
        .map(ticket => loadedAction(action, profile, readTheme(store), ticket)))
      .catch(error => failedLoad(action, error)));
}

/**
 * Writes the shop, then the ticket, then the theme. A failure stops the rest of the click.
 * @param {{updateShopProfile: {update: Function}, updateSellPreferences?: {update: Function}, changeTheme: {changeTheme: Function}, getShopProfile: {getProfile: Function}, getSellPreferences?: {get: Function}}} deps
 */
export function makeSettingsSaveEpic(deps) {
  return (action$, store) => action$
    .filter(action => action.type === SETTINGS_SAVE_REQUESTED)
    .exhaustMap(() => writeSettings(deps, readSettings(store)));
}

/**
 * @param {{type: string}} action
 * @returns {boolean}
 */
function isLoad(action) {
  return action.type === SETTINGS_PAGE_OPENED || action.type === SHOP_PROFILE_REQUESTED;
}

/**
 * @param {{type: string}} action
 * @param {{get: Function}} [getSellPreferences]
 */
function ticketFor(action, getSellPreferences) {
  if (action.type !== SETTINGS_PAGE_OPENED || !getSellPreferences || typeof getSellPreferences.get !== 'function') {
    return Rx.Observable.of(null);
  }
  return getSellPreferences.get();
}

/**
 * @param {{type: string}} action
 * @param {object} profile
 * @param {string} theme
 * @param {object | null} ticket
 */
function loadedAction(action, profile, theme, ticket) {
  if (action.type === SHOP_PROFILE_REQUESTED) {
    return shopProfileLoaded(profile);
  }
  return settingsLoaded(profile, theme, ticket);
}

/**
 * @param {{type: string}} action
 * @param {*} error
 */
function failedLoad(action, error) {
  record(error);
  if (action.type === SHOP_PROFILE_REQUESTED) {
    return Rx.Observable.empty();
  }
  return Rx.Observable.of(settingsFailed(LOAD_ERROR));
}

/**
 * @param {{getState: Function}} store
 * @returns {string}
 */
function readTheme(store) {
  const root = store && store.getState ? store.getState() : {};
  const appearance = root.appearance || {};
  return appearance.theme || 'mercado';
}

/**
 * @param {{getState: Function}} store
 */
function readSettings(store) {
  const root = store && store.getState ? store.getState() : {};
  return root.settings || state();
}

/**
 * @param {{updateShopProfile: {update: Function}, updateSellPreferences?: {update: Function}, changeTheme: {changeTheme: Function}, getShopProfile: {getProfile: Function}, getSellPreferences?: {get: Function}}} deps
 * @param {object} page
 */
function writeSettings(deps, page) {
  const plan = savePlan(page);
  if (!plan.proceed) {
    return Rx.Observable.empty();
  }
  const shop$ = plan.shop ? deps.updateShopProfile.update(plan.command) : Rx.Observable.of(null);
  return shop$
    .flatMap(() => writeTicket(deps, plan))
    .flatMap(() => plan.theme ? writeTheme(deps, plan) : finish(deps, null))
    .catch(error => saveRejected(page, error));
}

/**
 * @param {{updateSellPreferences?: {update: Function}}} deps
 * @param {{ticket: boolean, ticketCommand: object}} plan
 */
function writeTicket(deps, plan) {
  if (!plan.ticket) {
    return Rx.Observable.of(null);
  }
  return deps.updateSellPreferences.update(plan.ticketCommand);
}

/**
 * @param {{changeTheme: {changeTheme: Function}, getShopProfile: {getProfile: Function}}} deps
 * @param {object} plan
 */
function writeTheme(deps, plan) {
  return deps.changeTheme.changeTheme({theme: plan.themeId})
    .flatMap(preferences => finish(deps, preferences.theme.id))
    .catch(error => themeFailed(plan, error));
}

/**
 * @param {{getShopProfile: {getProfile: Function}, getSellPreferences?: {get: Function}}} deps
 * @param {string | null} themeId
 */
function finish(deps, themeId) {
  return deps.getShopProfile.getProfile()
    .flatMap(view => savedTicket(deps).map(ticket => ({view, ticket})))
    .mergeMap(({view, ticket}) => Rx.Observable.from(successActions(view, themeId, ticket)))
    .catch(error => reloadFailed(themeId, error));
}

/**
 * @param {{getSellPreferences?: {get: Function}}} deps
 */
function savedTicket(deps) {
  if (!deps.getSellPreferences || typeof deps.getSellPreferences.get !== 'function') {
    return Rx.Observable.of(null);
  }
  return deps.getSellPreferences.get();
}

/**
 * @param {object} view
 * @param {string | null} themeId
 * @param {object | null} ticket
 * @returns {object[]}
 */
function successActions(view, themeId, ticket) {
  const actions = [settingsSaved(view, themeId, ticket)];
  if (themeId) {
    actions.push(themeChanged(themeId));
  }
  actions.push(savedToast());
  return actions;
}

/**
 * @param {*} error
 */
function reloadFailed(themeId, error) {
  record(error);
  const actions = [settingsSaveFailed({message: SAVE_ERROR})];
  if (themeId) {
    actions.unshift(themeChanged(themeId));
  }
  return Rx.Observable.from(actions);
}

/**
 * A ticket failure and a shop failure both stop the click. Copy that is too
 * long is reported on that field.
 * @param {object} page
 * @param {*} error
 */
function saveRejected(page, error) {
  record(error);
  const copyErrors = error && error.code === ErrorCode.SELL_PREFERENCES_INVALID
    ? copyFieldErrors(error)
    : null;
  if (copyErrors) {
    return Rx.Observable.of(settingsSaveFailed({fieldErrors: copyErrors}));
  }
  if (error && error.code === ErrorCode.TAX_ID_INVALID) {
    return Rx.Observable.of(settingsSaveFailed({fieldErrors: {nif: NIF_INVALID}}));
  }
  if (error && error.code === ErrorCode.SHOP_PROFILE_INCOMPLETE) {
    return Rx.Observable.of(settingsSaveFailed({fieldErrors: incompleteOrBoth(page.draft)}));
  }
  return Rx.Observable.of(settingsSaveFailed({message: SAVE_ERROR}));
}

/**
 * @param {object} draft
 */
function incompleteOrBoth(draft) {
  const errors = incompleteErrors(draft);
  if (!errors.nif && !errors.legalName) {
    return {nif: REQUIRED, legalName: REQUIRED};
  }
  return errors;
}

/**
 * @param {object} plan
 * @param {*} error
 */
function themeFailed(plan, error) {
  record(error);
  const theme = plan.previousTheme || 'mercado';
  return Rx.Observable.of(
    themeChangeFailed(theme),
    settingsSaveFailed({message: THEME_SAVE_ERROR, theme})
  );
}
