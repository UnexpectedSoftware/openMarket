import ErrorCode from '../error/ErrorCode.js';
import AppError, {defined} from '../error/AppError.js';

/**
 * A printer type, interface, or character set is not one this till accepts.
 */
export default class InvalidPrinterSettingsError extends AppError {
  /**
   * @param {object} [params]
   * @param {string} [params.field]
   * @param {string} [params.value]
   */
  constructor({field, value} = {}) {
    super({
      code: ErrorCode.PRINTER_SETTINGS_INVALID,
      message: `Printer setting ${field} is not valid`,
      userMessage: 'invalid printer settings',
      context: defined({field, value}),
      level: 'warn'
    });
  }
}
