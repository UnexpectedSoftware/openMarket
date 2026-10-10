import ErrorCode from '../error/ErrorCode.js';
import AppError from '../error/AppError.js';

/**
 * An order was built with no lines.
 */
export default class EmptyOrderLinesError extends AppError {

  constructor() {
    super({
      code: ErrorCode.ORDER_LINES_EMPTY,
      message: 'Lines must not be empty',
      userMessage: 'Lines must not be empty',
      context: {operation: 'create'},
      level: 'warn'
    });
  }

}
