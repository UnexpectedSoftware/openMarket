import SellLayout from './SellLayout';
import Theme from './Theme';

/**
 * How this till looks. One row for the whole database, so each device keeps its own theme and sell layout.
 */
export default class AppearancePreferences {

  /**
   * @returns {AppearancePreferences}
   */
  static defaults() {
    return new AppearancePreferences({theme: Theme.DEFAULT, layout: SellLayout.DEFAULT});
  }

  /**
   * A missing layout is Mostrador, so a row saved before presets still opens the counter.
   * @param {{theme: Theme | string, layout?: SellLayout | string | null}} props
   */
  constructor({theme, layout}) {
    this._theme = theme instanceof Theme ? theme : Theme.of(theme);
    this._layout = storedLayout(layout);
  }

  /** @returns {Theme} */
  get theme() {
    return this._theme;
  }

  /** @returns {SellLayout} */
  get layout() {
    return this._layout;
  }

  /**
   * @param {{theme: Theme | string}} change
   * @returns {AppearancePreferences}
   */
  changeTheme({theme}) {
    this._theme = theme instanceof Theme ? theme : Theme.of(theme);
    return this;
  }

  /**
   * @param {{layout: SellLayout | string}} change
   * @returns {AppearancePreferences}
   */
  changeLayout({layout}) {
    this._layout = layout instanceof SellLayout ? layout : SellLayout.of(layout);
    return this;
  }

}

/**
 * @param {SellLayout | string | null | undefined} layout
 * @returns {SellLayout}
 */
function storedLayout(layout) {
  if (layout instanceof SellLayout) {
    return layout;
  }
  if (layout == null || layout === '') {
    return SellLayout.DEFAULT;
  }
  return SellLayout.of(layout);
}
