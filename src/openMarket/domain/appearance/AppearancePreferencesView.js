/**
 * The till's appearance as stored, for a screen to read. `theme` is the id
 * string and defaults to `mercado`. `layout` is the preset id and defaults to
 * `mostrador`. It does not hold a `Theme` or a `SellLayout`, and it does not
 * construct an `AppearancePreferences`. The write aggregate is `AppearancePreferences`.
 */
export default class AppearancePreferencesView {

  /**
   * @param {{theme?: string | null, layout?: string | null}} [props]
   */
  constructor({theme, layout} = {}) {
    this.theme = theme || 'mercado';
    this.layout = layout || 'mostrador';
    Object.freeze(this);
  }

}
