import Theme from './Theme';

/**
 * How this till looks. One row for the whole database, so each device keeps its own theme.
 */
export default class AppearancePreferences {

  /**
   * @returns {AppearancePreferences}
   */
  static defaults() {
    return new AppearancePreferences({theme: Theme.DEFAULT});
  }

  /**
   * @param {{theme: Theme | string}} props
   */
  constructor({theme}) {
    this._theme = theme instanceof Theme ? theme : Theme.of(theme);
  }

  /** @returns {Theme} */
  get theme() {
    return this._theme;
  }

  /**
   * @param {{theme: Theme | string}} change
   * @returns {AppearancePreferences}
   */
  changeTheme({theme}) {
    this._theme = theme instanceof Theme ? theme : Theme.of(theme);
    return this;
  }

}
