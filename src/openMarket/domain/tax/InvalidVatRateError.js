import ErrorCode from '../error/ErrorCode.js';
import AppError, {defined} from '../error/AppError.js';

/**
 * A VAT rate is not one of the rates the shop can sell at.
 */
export default class InvalidVatRateError extends AppError {
  /**
   * @param {object} [params]
   * @param {string} [params.kind]
   * @param {number | string} [params.percent]
   * @param {string | null} [params.cause]
   */
  constructor({kind, percent, cause} = {}) {
    super({
      code: ErrorCode.VAT_RATE_INVALID,
      message: 'VAT rate is not allowed',
      userMessage: 'invalid VAT rate',
      context: defined({kind, percent, cause}),
      level: 'warn'
    });
  }
}
