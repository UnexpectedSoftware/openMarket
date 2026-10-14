import ErrorCode from '../error/ErrorCode.js';
import AppError, {defined} from '../error/AppError.js';

/**
 * An invoice is missing something it must keep, such as its id or its issue time.
 */
export default class InvalidInvoiceError extends AppError {

  /**
   * @param {object} [params]
   * @param {string} [params.field]
   * @param {string} [params.id]
   */
  constructor({field, id} = {}) {
    super({
      code: ErrorCode.INVOICE_INVALID,
      message: 'Invoice ' + (field || 'data') + ' is not valid',
      userMessage: 'Invoice is not valid',
      context: defined({field, id, operation: 'issue'}),
      level: 'warn'
    });
  }

}
