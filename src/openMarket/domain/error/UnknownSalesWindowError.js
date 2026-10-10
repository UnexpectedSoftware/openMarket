import ErrorCode from './ErrorCode.js';
import AppError from './AppError.js';

/**
 * The sales screen asked for a window id that is not in the list.
 */
export default class UnknownSalesWindowError extends AppError {

  /**
   * @param {string} window
   */
  constructor({window} = {}) {
    super({
      code: ErrorCode.SALES_WINDOW_UNKNOWN,
      message: 'Unknown sales window ' + window,
      userMessage: 'Unknown sales window ' + window,
      context: {window},
      level: 'error'
    });
  }

}
