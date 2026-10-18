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
  THEME_CHANGE_FAILED,
  THEME_CHANGE_REQUESTED,
  THEME_CHANGED,
  THEME_PREVIEW_DISCARD_REQUESTED,
  THEME_PREVIEW_DISCARDED,
  THEME_PREVIEW_REQUESTED,
  THEME_PREVIEWED,
  themeChangeFailed,
  themeChanged,
  themePreviewDiscarded,
  themePreviewed
} from './action';

/**
 * @param {string} theme
 */
export function applyTheme(theme) {
  if (typeof document !== 'undefined' && document.documentElement) {
    document.documentElement.dataset.theme = theme;
  }
}

const savedToast = () => toast.success('Tema guardado', 'La apariencia se ha guardado');

/**
 * @param {*} failure
 */
function failedToast(failure) {
  return toast.error('El tema no se ha guardado', userText(failure, 'El tema no se ha guardado'));
}

/**
 * Paints `data-theme` before Redux tells the charts to render again.
 * @param {{changeTheme: {changeTheme: Function}}} deps
 */
export function makeAppearanceEpic({changeTheme}) {
  const preview = action$ => action$
    .filter(action => action.type === THEME_PREVIEW_REQUESTED)
    .map(action => {
      applyTheme(action.theme);
      return themePreviewed(action.theme);
    });

  const discard = action$ => action$
    .filter(action => action.type === THEME_PREVIEW_DISCARD_REQUESTED)
    .map(action => {
      applyTheme(action.theme);
      return themePreviewDiscarded(action.theme);
    });

  const save = action$ => action$
    .filter(action => action.type === THEME_CHANGE_REQUESTED)
    .flatMap(action => {
      applyTheme(action.theme);
      return changeTheme.changeTheme({theme: action.theme})
        .flatMap(preferences => {
          const theme = preferences.theme.id;
          applyTheme(theme);
          return Rx.Observable.of(themeChanged(theme), savedToast());
        })
        .catch(failure => {
          const theme = action.previous || 'mercado';
          applyTheme(theme);
          return Rx.Observable.of(themeChangeFailed(theme), failedToast(failure));
        });
    });

  const paint = action$ => action$
    .filter(action =>
      action.type === THEME_CHANGED ||
      action.type === THEME_CHANGE_FAILED ||
      action.type === THEME_PREVIEWED ||
      action.type === THEME_PREVIEW_DISCARDED)
    .do(action => applyTheme(action.theme))
    .filter(() => false);

  return action$ => Rx.Observable.merge(preview(action$), discard(action$), save(action$), paint(action$));
}
