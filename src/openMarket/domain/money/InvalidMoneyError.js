import ErrorCode from '../error/ErrorCode.js';
import AppError, {defined} from '../error/AppError.js';

/**
 * A money or quantity value was not a finite integer in its storage unit.
 */
export default class InvalidMoneyError extends AppError {
  /**
   * @param {object} [params]
   * @param {string} [params.message]
   * @param {number | string} [params.value]
   */
  constructor({message, value} = {}) {
    super({
      code: ErrorCode.MONEY_INVALID,
      message: message || 'Money must be an integer number of cents',
      userMessage: 'invalid amount',
      context: defined({value}),
      level: 'warn'
    });
  }
}
