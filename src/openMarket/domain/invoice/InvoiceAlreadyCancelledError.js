import ErrorCode from '../error/ErrorCode.js';
import AppError, {defined} from '../error/AppError.js';

/**
 * A cancelled invoice was cancelled again. The issued document stays as it is.
 */
export default class InvoiceAlreadyCancelledError extends AppError {

  /**
   * @param {object} [params]
   * @param {string} [params.id]
   * @param {string} [params.invoiceNumber]
   */
  constructor({id, invoiceNumber} = {}) {
    super({
      code: ErrorCode.INVOICE_ALREADY_CANCELLED,
      message: `Invoice ${invoiceNumber || id || 'unknown'} is already cancelled`,
      userMessage: 'Invoice is already cancelled',
      context: defined({id, invoiceNumber, operation: 'cancel'}),
      level: 'warn'
    });
  }

}
