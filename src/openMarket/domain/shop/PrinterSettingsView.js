/**
 * The till's printer as stored, for a screen to read.
 * Defaults are Epson, `/dev/usb/lp`, and SPAIN1. It does not construct a
 * `PrinterSettings` and it does not check those values. The write aggregate
 * is `PrinterSettings`.
 */
export default class PrinterSettingsView {

  /**
   * @param {object} [props]
   * @param {string} [props.type]
   * @param {string} [props.interface]
   * @param {string} [props.characterSet]
   */
  constructor({type = 'epson', interface: device = '/dev/usb/lp', characterSet = 'SPAIN1'} = {}) {
    this.type = type;
    this.interface = device;
    this.characterSet = characterSet;
    Object.freeze(this);
  }

}
