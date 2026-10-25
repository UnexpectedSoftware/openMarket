/**
 * The till's appearance as stored, for a screen to read. `theme` is the id
 * string and defaults to `mercado`. It does not hold a `Theme` and it does
 * not construct an `AppearancePreferences`. The write aggregate is `AppearancePreferences`.
 */
export default class AppearancePreferencesView {

  /**
   * @param {{theme?: string | null}} [props]
   */
  constructor({theme} = {}) {
    this.theme = theme || 'mercado';
    Object.freeze(this);
  }

}
