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
import {layoutChanged, layoutChangeFailed, themeChanged, themeChangeFailed} from '../appearance/action';
import {toast} from '../components/toast';
import {
  SETTINGS_PAGE_OPENED,
  SETTINGS_SAVE_REQUESTED,
  SHOP_PROFILE_REQUESTED,
  settingsFailed,
  settingsLoaded,
  settingsSaved,
  settingsSaveFailed,
  settingsTestPrintFailed,
  settingsTestPrinted,
  SETTINGS_TEST_PRINT_REQUESTED,
  shopProfileLoaded
} from './action';
import {
  LOAD_ERROR,
  NIF_INVALID,
  PRINT_ERROR,
  REQUIRED,
  SAVE_ERROR,
  LAYOUT_SAVE_ERROR,
  THEME_SAVE_ERROR,
  copyFieldErrors,
  incompleteErrors,
  printerFieldErrors,
  savePlan,
  state,
  testPrintPlan
} from './model';

const savedToast = () => toast.success('Ajustes guardados', 'Los cambios quedan guardados');

/**
 * Latest open wins. A sell-screen request refreshes the issuer and leaves the draft.
 * A page open also reads the ticket, the printer, and the locale.
 * @param {{getProfile: Function}} getShopProfile
 * @param {{get: Function}} [getSellPreferences]
 * @param {{get: Function}} [getPrinterSettings]
 * @param {{get: Function}} [getLanguagePreferences]
 */
export function makeSettingsLoadEpic(getShopProfile, getSellPreferences, getPrinterSettings, getLanguagePreferences) {
  return (action$, store) => action$
    .filter(isLoad)
    .switchMap(action => getShopProfile.getProfile()
      .flatMap(profile => readSection(action, getSellPreferences).map(ticket => ({profile, ticket})))
      .flatMap(loaded => readSection(action, getPrinterSettings).map(printer => ({...loaded, printer})))
      .flatMap(loaded => readSection(action, getLanguagePreferences).map(language => loadedAction(
        action,
        loaded.profile,
        readTheme(store),
        loaded.ticket,
        loaded.printer,
        language,
        readLayout(store)
      )))
      .catch(error => failedLoad(action, error)));
}

/**
 * Writes the shop, then the ticket, then the theme. A failure stops the rest of the click.
 * @param {object} deps
 * @param {{update: Function}} deps.updateShopProfile
 * @param {{update: Function}} [deps.updateSellPreferences]
 * @param {{update: Function}} [deps.updatePrinterSettings]
 * @param {{update: Function}} [deps.updateLanguagePreferences]
 * @param {{changeTheme: Function}} deps.changeTheme
 * @param {{changeLayout: Function}} [deps.changeLayout]
 * @param {{getProfile: Function}} deps.getShopProfile
 * @param {{get: Function}} [deps.getSellPreferences]
 * @param {{get: Function}} [deps.getPrinterSettings]
 * @param {{get: Function}} [deps.getLanguagePreferences]
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
 * Page open reads one section. A sell-screen refresh does not.
 * @param {{type: string}} action
 * @param {{get: Function}} [useCase]
 */
function readSection(action, useCase) {
  if (action.type !== SETTINGS_PAGE_OPENED || !useCase || typeof useCase.get !== 'function') {
    return Rx.Observable.of(null);
  }
  return useCase.get();
}

/**
 * @param {{type: string}} action
 * @param {object} profile
 * @param {string} theme
 * @param {object | null} ticket
 * @param {object | null} printer
 * @param {object | null} language
 * @param {string} [layout]
 */
function loadedAction(action, profile, theme, ticket, printer, language, layout) {
  if (action.type === SHOP_PROFILE_REQUESTED) {
    return shopProfileLoaded(profile);
  }
  return settingsLoaded(profile, theme, ticket, printer, language, layout);
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
  const appearance = appearanceOf(store);
  return appearance.theme || 'mercado';
}

/**
 * @param {{getState: Function}} store
 * @returns {string}
 */
function readLayout(store) {
  const appearance = appearanceOf(store);
  return appearance.layout || 'mostrador';
}

/**
 * @param {{getState: Function}} store
 * @returns {object}
 */
function appearanceOf(store) {
  const root = store && store.getState ? store.getState() : {};
  return root.appearance || {};
}

/**
 * @param {{getState: Function}} store
 */
function readSettings(store) {
  const root = store && store.getState ? store.getState() : {};
  return root.settings || state();
}

/**
 * @param {object} deps
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
    .flatMap(() => writePrinter(deps, plan))
    .flatMap(() => writeLanguage(deps, plan))
    .flatMap(() => writeAppearance(deps, plan))
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
 * @param {{updatePrinterSettings?: {update: Function}}} deps
 * @param {{printer: boolean, printerCommand: object}} plan
 */
function writePrinter(deps, plan) {
  if (!plan.printer) {
    return Rx.Observable.of(null);
  }
  return deps.updatePrinterSettings.update(plan.printerCommand);
}

/**
 * @param {{updateLanguagePreferences?: {update: Function}}} deps
 * @param {{language: boolean, languageCommand: object}} plan
 */
function writeLanguage(deps, plan) {
  if (!plan.language) {
    return Rx.Observable.of(null);
  }
  return deps.updateLanguagePreferences.update(plan.languageCommand);
}

/**
 * Layout is written before the theme. A layout failure stops the theme write.
 * @param {{changeLayout?: {changeLayout: Function}, changeTheme: {changeTheme: Function}}} deps
 * @param {object} plan
 */
function writeAppearance(deps, plan) {
  if (!plan.layout) {
    return afterLayout(deps, plan, null);
  }
  return deps.changeLayout.changeLayout({layout: plan.layoutId})
    .flatMap(preferences => afterLayout(deps, plan, preferences.layout.id))
    .catch(error => layoutFailed(plan, error));
}

/**
 * @param {object} deps
 * @param {object} plan
 * @param {string | null} layoutId
 */
function afterLayout(deps, plan, layoutId) {
  if (plan.theme) {
    return writeTheme(deps, plan, layoutId);
  }
  return finish(deps, null, layoutId);
}

/**
 * @param {{changeTheme: {changeTheme: Function}, getShopProfile: {getProfile: Function}}} deps
 * @param {object} plan
 * @param {string | null} layoutId
 */
function writeTheme(deps, plan, layoutId) {
  return deps.changeTheme.changeTheme({theme: plan.themeId})
    .flatMap(preferences => finish(deps, preferences.theme.id, layoutId))
    .catch(error => themeFailed(plan, error, layoutId));
}

/**
 * @param {{getShopProfile: {getProfile: Function}, getSellPreferences?: {get: Function}}} deps
 * @param {string | null} themeId
 * @param {string | null} layoutId
 */
function finish(deps, themeId, layoutId) {
  return deps.getShopProfile.getProfile()
    .flatMap(view => readOptional(deps.getSellPreferences).map(ticket => ({view, ticket})))
    .flatMap(loaded => readOptional(deps.getPrinterSettings).map(printer => ({...loaded, printer})))
    .flatMap(loaded => readOptional(deps.getLanguagePreferences).map(language => ({...loaded, language})))
    .mergeMap(loaded => Rx.Observable.from(successActions(
      loaded.view,
      themeId,
      loaded.ticket,
      loaded.printer,
      loaded.language,
      layoutId
    )))
    .catch(error => reloadFailed(themeId, layoutId, error));
}

/**
 * @param {{get?: Function}} [useCase]
 */
function readOptional(useCase) {
  if (!useCase || typeof useCase.get !== 'function') {
    return Rx.Observable.of(null);
  }
  return useCase.get();
}

/**
 * @param {object} view
 * @param {string | null} themeId
 * @param {object | null} ticket
 * @param {object | null} printer
 * @param {object | null} language
 * @param {string | null} layoutId
 * @returns {object[]}
 */
function successActions(view, themeId, ticket, printer, language, layoutId) {
  const actions = [settingsSaved(view, themeId, ticket, printer, language, layoutId)];
  if (layoutId) {
    actions.push(layoutChanged(layoutId));
  }
  if (themeId) {
    actions.push(themeChanged(themeId));
  }
  actions.push(savedToast());
  return actions;
}

/**
 * @param {string | null} themeId
 * @param {string | null} layoutId
 * @param {*} error
 */
function reloadFailed(themeId, layoutId, error) {
  record(error);
  const actions = [settingsSaveFailed({message: SAVE_ERROR})];
  if (layoutId) {
    actions.unshift(layoutChanged(layoutId));
  }
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
  const deviceErrors = error && error.code === ErrorCode.PRINTER_SETTINGS_INVALID
    ? printerFieldErrors(error)
    : null;
  if (deviceErrors) {
    return Rx.Observable.of(settingsSaveFailed({fieldErrors: deviceErrors}));
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
 * @param {string | null} [layoutId] layout already stored on this click
 */
function themeFailed(plan, error, layoutId) {
  record(error);
  const theme = plan.previousTheme || 'mercado';
  const failure = {message: THEME_SAVE_ERROR, theme};
  const actions = [themeChangeFailed(theme), settingsSaveFailed(failure)];
  if (layoutId) {
    failure.layout = layoutId;
    actions.unshift(layoutChanged(layoutId));
  }
  return Rx.Observable.of(...actions);
}

/**
 * @param {object} plan
 * @param {*} error
 */
function layoutFailed(plan, error) {
  record(error);
  const layout = plan.previousLayout || 'mostrador';
  return Rx.Observable.of(
    layoutChangeFailed(layout),
    settingsSaveFailed({message: LAYOUT_SAVE_ERROR, layout})
  );
}

/**
 * Saves a dirty printer, then prints the sample. A device failure stays on the card.
 * @param {{updatePrinterSettings?: {update: Function}, printTestTicket: {print: Function}}} deps
 */
export function makeSettingsTestPrintEpic(deps) {
  return (action$, store) => action$
    .filter(action => action.type === SETTINGS_TEST_PRINT_REQUESTED)
    .exhaustMap(() => printSample(deps, readSettings(store)));
}

/**
 * @param {{updatePrinterSettings?: {update: Function}, printTestTicket: {print: Function}}} deps
 * @param {object} page
 */
function printSample(deps, page) {
  const plan = testPrintPlan(page);
  if (!plan.proceed) {
    return Rx.Observable.empty();
  }
  const save$ = plan.save
    ? deps.updatePrinterSettings.update(plan.command)
    : Rx.Observable.of(null);
  return save$
    .flatMap(savedPrinter => printNow(deps, savedPrinter))
    .catch(error => saveRejected(page, error));
}

/**
 * @param {{printTestTicket: {print: Function}}} deps
 * @param {object | null} savedPrinter
 */
function printNow(deps, savedPrinter) {
  return deps.printTestTicket.print()
    .map(() => settingsTestPrinted(savedPrinter))
    .catch(error => {
      record(error);
      return Rx.Observable.of(settingsTestPrintFailed({
        message: PRINT_ERROR,
        printer: savedPrinter
      }));
    });
}
