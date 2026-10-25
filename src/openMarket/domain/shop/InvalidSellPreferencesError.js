import ErrorCode from '../error/ErrorCode.js';
import AppError, {defined} from '../error/AppError.js';

/**
 * A print mode, a paper width, or ticket copy is not one this till accepts.
 */
export default class InvalidSellPreferencesError extends AppError {
  /**
   * @param {object} [params]
   * @param {string} [params.field]
   * @param {string | number} [params.value]
   */
  constructor({field, value} = {}) {
    super({
      code: ErrorCode.SELL_PREFERENCES_INVALID,
      message: `Sell preference ${field} is not valid`,
      userMessage: 'invalid sell preferences',
      context: defined({field, value}),
      level: 'warn'
    });
  }
}
