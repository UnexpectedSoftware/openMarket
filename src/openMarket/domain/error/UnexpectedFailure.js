import ErrorCode from './ErrorCode.js';
import AppError from './AppError.js';

/**
 * A SQLite, filesystem, or network failure that has no domain meaning of its own.
 * The driver error is `cause`. `userMessage` stays the driver text so a toast
 * still shows "disk full" and the log keeps the operation around it.
 */
export default class UnexpectedFailure extends AppError {

  /**
   * @param {string} [message]
   * @param {string} [userMessage]
   * @param {Object} [context]
   * @param {Error} [cause]
   */
  constructor({message, userMessage, context, cause} = {}) {
    const detail = userMessage || (cause && cause.message) || message || 'Unexpected failure';
    super({
      code: ErrorCode.UNEXPECTED,
      message: message || detail,
      userMessage: detail,
      context,
      cause,
      level: 'error'
    });
  }

}
