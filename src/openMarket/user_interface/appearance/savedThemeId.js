import {record} from '../../infrastructure/logging/ErrorLog';
import SellLayout from '../../domain/appearance/SellLayout';
import Theme from '../../domain/appearance/Theme';

/**
 * Reads one stored id before the first paint. A throw stays on the fallback.
 * @param {{get: function(): {subscribe: Function}}} getAppearance
 * @param {function(*): string} apply
 * @param {string} fallback
 * @returns {string}
 */
export function readPreference(getAppearance, apply, fallback) {
  let value = fallback;
  try {
    getAppearance.get().subscribe(
      preferences => {
        value = apply(preferences);
      },
      error => {
        record(error);
        value = fallback;
      }
    );
  } catch (error) {
    record(error);
    value = fallback;
  }
  return value;
}

/**
 * The stored theme id, read synchronously before the first paint.
 * The appearance view stores the id string. A failed read stays on Mercado.
 * @param {{get: function(): {subscribe: Function}}} getAppearance
 * @returns {string}
 */
export default function savedThemeId(getAppearance) {
  return readPreference(getAppearance, preferences => preferences.theme, Theme.DEFAULT.id);
}

/**
 * The stored sell-screen preset. A failed or unknown read stays on Mostrador.
 * @param {{get: function(): {subscribe: Function}}} getAppearance
 * @returns {string}
 */
export function savedLayoutId(getAppearance) {
  return readPreference(
    getAppearance,
    preferences => SellLayout.orDefault(preferences && preferences.layout),
    SellLayout.DEFAULT.id
  );
}
