import ErrorCode from '../error/ErrorCode.js';
import AppError, {defined} from '../error/AppError.js';

/**
 * A receipt block failed validation.
 */
export default class InvalidReceiptBlockError extends AppError {
  /**
   * @param {object} [params]
   * @param {string} [params.type]
   * @param {string} [params.field]
   */
  constructor({type, field} = {}) {
    super({
      code: ErrorCode.RECEIPT_BLOCK_INVALID,
      message: `Receipt block ${type || 'unknown'} is not valid`,
      userMessage: 'The receipt could not be printed',
      context: defined({type, field}),
      level: 'warn'
    });
  }
}
