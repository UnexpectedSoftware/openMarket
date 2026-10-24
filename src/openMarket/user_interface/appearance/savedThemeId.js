import {record} from '../../infrastructure/logging/ErrorLog';
import Theme from '../../domain/appearance/Theme';

/**
 * The stored theme id, read synchronously before the first paint.
 * The appearance view stores the id string. A failed read stays on Mercado.
 * @param {{get: function(): {subscribe: Function}}} getAppearance
 * @returns {string}
 */
export default function savedThemeId(getAppearance) {
  let themeId = Theme.DEFAULT.id;
  try {
    getAppearance.get().subscribe(
      preferences => {
        themeId = preferences.theme;
      },
      error => {
        record(error);
        themeId = Theme.DEFAULT.id;
      }
    );
  } catch (error) {
    record(error);
    themeId = Theme.DEFAULT.id;
  }
  return themeId;
}
