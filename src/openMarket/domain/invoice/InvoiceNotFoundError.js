import ErrorCode from '../error/ErrorCode.js';
import AppError, {defined} from '../error/AppError.js';

/**
 * A command that needs an invoice did not find one.
 */
export default class InvoiceNotFoundError extends AppError {

  /**
   * @param {object} [params]
   * @param {string} [params.id]
   * @param {string} [params.operation]
   */
  constructor({id, operation} = {}) {
    super({
      code: ErrorCode.INVOICE_NOT_FOUND,
      message: `Invoice ${id || 'unknown'} was not found`,
      userMessage: 'Invoice not found',
      context: defined({id, operation}),
      level: 'warn'
    });
  }

}
