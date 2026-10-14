import ErrorCode from '../error/ErrorCode.js';
import AppError from '../error/AppError.js';

/**
 * An invoice was issued with no lines.
 */
export default class EmptyInvoiceLinesError extends AppError {

  constructor() {
    super({
      code: ErrorCode.INVOICE_LINES_EMPTY,
      message: 'Lines must not be empty',
      userMessage: 'Lines must not be empty',
      context: {operation: 'issue'},
      level: 'warn'
    });
  }

}
