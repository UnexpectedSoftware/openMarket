/**
 * The till's sell preferences as stored, for a screen to read. `autoPrint`
 * defaults to false. It does not construct a `SellPreferences`. The write
 * aggregate is `SellPreferences`.
 */
export default class SellPreferencesView {

  /**
   * @param {{autoPrint?: boolean}} [props]
   */
  constructor({autoPrint = false} = {}) {
    this.autoPrint = autoPrint === true;
    Object.freeze(this);
  }

}
