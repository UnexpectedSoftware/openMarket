import InvalidPrinterSettingsError from './InvalidPrinterSettingsError';

const INTERFACE_MAX = 200;
const DEFAULT_INTERFACE = '/dev/usb/lp';

/**
 * The till's thermal printer. Saving does not open the device.
 * Epson on `/dev/usb/lp` with SPAIN1 is the default.
 */
export default class PrinterSettings {

  /** @returns {PrinterSettings} */
  static defaults() {
    return new PrinterSettings({});
  }

  /**
   * @param {object} [props]
   * @param {string} [props.type]
   * @param {string} [props.interface]
   * @param {string} [props.characterSet]
   */
  constructor({type, interface: device, characterSet} = {}) {
    /** @private */
    this._type = type === undefined ? 'epson' : requiredType(type);
    /** @private */
    this._interface = device === undefined ? DEFAULT_INTERFACE : requiredInterface(device);
    /** @private */
    this._characterSet = characterSet === undefined ? 'SPAIN1' : requiredSet(characterSet);
  }

  /** @returns {'epson' | 'star'} */
  get type() {
    return this._type;
  }

  /** @returns {string} */
  get interface() {
    return this._interface;
  }

  /** @returns {'SPAIN1' | 'PC858' | 'PC850' | 'WPC1252'} */
  get characterSet() {
    return this._characterSet;
  }

  /**
   * @param {string} type
   * @returns {PrinterSettings}
   */
  withType(type) {
    return new PrinterSettings({
      type,
      interface: this._interface,
      characterSet: this._characterSet
    });
  }

  /**
   * @param {string} device
   * @returns {PrinterSettings}
   */
  withInterface(device) {
    return new PrinterSettings({
      type: this._type,
      interface: device,
      characterSet: this._characterSet
    });
  }

  /**
   * @param {string} characterSet
   * @returns {PrinterSettings}
   */
  withCharacterSet(characterSet) {
    return new PrinterSettings({
      type: this._type,
      interface: this._interface,
      characterSet
    });
  }

}

/**
 * @param {string} type
 * @returns {'epson' | 'star'}
 */
function requiredType(type) {
  if (type === 'epson' || type === 'star') {
    return type;
  }
  throw new InvalidPrinterSettingsError({field: 'type', value: type});
}

/**
 * Trims. An empty path and a path longer than 200 characters are rejected.
 * @param {string | null | undefined} device
 * @returns {string}
 */
function requiredInterface(device) {
  const text = device == null ? '' : String(device).trim();
  if (text === '') {
    throw new InvalidPrinterSettingsError({field: 'interface', value: text});
  }
  if (text.length > INTERFACE_MAX) {
    return rejectInterface(text);
  }
  return text;
}

/**
 * @param {string} text
 * @returns {never}
 */
function rejectInterface(text) {
  throw new InvalidPrinterSettingsError({field: 'interface', value: text});
}

/**
 * @param {string} characterSet
 * @returns {'SPAIN1' | 'PC858' | 'PC850' | 'WPC1252'}
 */
function requiredSet(characterSet) {
  if (characterSet === 'SPAIN1' || characterSet === 'PC858' || characterSet === 'PC850' || characterSet === 'WPC1252') {
    return characterSet;
  }
  throw new InvalidPrinterSettingsError({field: 'characterSet', value: characterSet});
}
