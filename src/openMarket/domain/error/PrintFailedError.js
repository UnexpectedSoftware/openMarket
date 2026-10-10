import ErrorCode from './ErrorCode.js';
import AppError from './AppError.js';

/**
 * A catalog print stopped. `printed` and `total` say how far the ticket got.
 * The device or busy error is `cause`. The message stays the cause text so the
 * toast can still say "Printer is busy".
 */
export default class PrintFailedError extends AppError {

  /**
   * @param {Error} [cause]
   * @param {number} printed
   * @param {number} total
   */
  constructor({cause, printed, total} = {}) {
    const detail = (cause && (cause.userMessage || cause.message)) || 'Could not print products';
    super({
      code: ErrorCode.PRINT_FAILED,
      message: detail,
      userMessage: detail,
      context: {printed, total},
      cause,
      level: 'error'
    });
    this.printed = printed;
    this.total = total;
  }

}
