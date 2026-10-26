import * as Rx from 'rxjs';
import 'rxjs/add/observable/merge';
import 'rxjs/add/observable/of';
import 'rxjs/add/operator/catch';
import 'rxjs/add/operator/do';
import 'rxjs/add/operator/filter';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/mergeMap';
import {userText} from '../../infrastructure/logging/ErrorLog';
import {toast} from '../components/toast';
import {
  LAYOUT_CHANGE_FAILED,
  LAYOUT_CHANGE_REQUESTED,
  LAYOUT_CHANGED,
  LAYOUT_PREVIEW_DISCARD_REQUESTED,
  LAYOUT_PREVIEW_DISCARDED,
  LAYOUT_PREVIEW_REQUESTED,
  LAYOUT_PREVIEWED,
  THEME_CHANGE_FAILED,
  THEME_CHANGE_REQUESTED,
  THEME_CHANGED,
  THEME_PREVIEW_DISCARD_REQUESTED,
  THEME_PREVIEW_DISCARDED,
  THEME_PREVIEW_REQUESTED,
  THEME_PREVIEWED,
  layoutChangeFailed,
  layoutChanged,
  layoutPreviewDiscarded,
  layoutPreviewed,
  themeChangeFailed,
  themeChanged,
  themePreviewDiscarded,
  themePreviewed
} from './action';

/**
 * @param {string} key
 * @param {string} value
 */
function paintDataset(key, value) {
  if (typeof document !== 'undefined' && document.documentElement) {
    document.documentElement.dataset[key] = value;
  }
}

/**
 * @param {string} theme
 */
export function applyTheme(theme) {
  paintDataset('theme', theme);
}

/**
 * @param {string} layout
 */
export function applyLayout(layout) {
  paintDataset('layout', layout);
}

/**
 * @param {string} title
 * @param {*} failure
 */
function failedToast(title, failure) {
  return toast.error(title, userText(failure, title));
}

/**
 * Preview, discard, and save for one appearance choice. The dataset paint
 * happens before Redux tells the screen to render again.
 * @param {object} config
 */
function makeChoiceEpic(config) {
  const preview = action$ => action$
    .filter(action => action.type === config.previewRequested)
    .map(action => {
      config.apply(action[config.field]);
      return config.previewed(action[config.field]);
    });

  const discard = action$ => action$
    .filter(action => action.type === config.discardRequested)
    .map(action => {
      config.apply(action[config.field]);
      return config.discarded(action[config.field]);
    });

  const save = action$ => action$
    .filter(action => action.type === config.changeRequested)
    .flatMap(action => saveChoice(config, action));

  const paintTypes = [
    config.changedType,
    config.failedType,
    config.previewedType,
    config.discardedType
  ];
  const paint = action$ => action$
    .filter(action => paintTypes.indexOf(action.type) !== -1)
    .do(action => config.apply(action[config.field]))
    .filter(() => false);

  return action$ => Rx.Observable.merge(preview(action$), discard(action$), save(action$), paint(action$));
}

/**
 * @param {object} config
 * @param {{previous?: string}} action
 */
function saveChoice(config, action) {
  const value = action[config.field];
  config.apply(value);
  return config.write(value)
    .flatMap(preferences => {
      const stored = config.idOf(preferences);
      config.apply(stored);
      return Rx.Observable.of(config.changed(stored));
    })
    .catch(failure => {
      const previous = action.previous || config.fallback;
      config.apply(previous);
      return Rx.Observable.of(config.failed(previous), failedToast(config.failureTitle, failure));
    });
}

/**
 * Paints `data-theme` before Redux tells the charts to render again.
 * @param {{changeTheme: {changeTheme: Function}}} deps
 */
export function makeAppearanceEpic({changeTheme}) {
  return makeChoiceEpic({
    field: 'theme',
    fallback: 'mercado',
    failureTitle: 'El tema no se ha guardado',
    apply: applyTheme,
    previewRequested: THEME_PREVIEW_REQUESTED,
    previewedType: THEME_PREVIEWED,
    previewed: themePreviewed,
    discardRequested: THEME_PREVIEW_DISCARD_REQUESTED,
    discardedType: THEME_PREVIEW_DISCARDED,
    discarded: themePreviewDiscarded,
    changeRequested: THEME_CHANGE_REQUESTED,
    changedType: THEME_CHANGED,
    changed: themeChanged,
    failedType: THEME_CHANGE_FAILED,
    failed: themeChangeFailed,
    write: theme => changeTheme.changeTheme({theme}),
    idOf: preferences => preferences.theme.id
  });
}

/**
 * Paints `data-layout` for the sell screen. Settings writes the preset itself
 * and dispatches the result; this epic also covers a direct change request.
 * @param {{changeLayout: {changeLayout: Function}}} deps
 */
export function makeLayoutEpic({changeLayout}) {
  return makeChoiceEpic({
    field: 'layout',
    fallback: 'mostrador',
    failureTitle: 'La disposición no se ha guardado',
    apply: applyLayout,
    previewRequested: LAYOUT_PREVIEW_REQUESTED,
    previewedType: LAYOUT_PREVIEWED,
    previewed: layoutPreviewed,
    discardRequested: LAYOUT_PREVIEW_DISCARD_REQUESTED,
    discardedType: LAYOUT_PREVIEW_DISCARDED,
    discarded: layoutPreviewDiscarded,
    changeRequested: LAYOUT_CHANGE_REQUESTED,
    changedType: LAYOUT_CHANGED,
    changed: layoutChanged,
    failedType: LAYOUT_CHANGE_FAILED,
    failed: layoutChangeFailed,
    write: layout => changeLayout.changeLayout({layout}),
    idOf: preferences => preferences.layout.id
  });
}
