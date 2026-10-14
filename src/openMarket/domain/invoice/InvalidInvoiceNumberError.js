import ErrorCode from '../error/ErrorCode.js';
import AppError, {defined} from '../error/AppError.js';

/**
 * A series or sequential number cannot be used on an invoice.
 */
export default class InvalidInvoiceNumberError extends AppError {

  /**
   * @param {object} [params]
   * @param {string} [params.series]
   * @param {*} [params.number]
   */
  constructor({series, number} = {}) {
    super({
      code: ErrorCode.INVOICE_NUMBER_INVALID,
      message: 'Invoice number is not valid',
      userMessage: 'Invoice number is not valid',
      context: defined({series, number, operation: 'issue'}),
      level: 'warn'
    });
  }

}
