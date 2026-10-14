import ErrorCode from '../error/ErrorCode.js';
import AppError, {defined} from '../error/AppError.js';

const MESSAGE = {
  quantity: 'Quantity must be greater than 0',
  price: 'Price must be zero or greater',
  line: 'Invoice line is incomplete'
};

/**
 * An invoice line failed a check before the invoice could be issued.
 */
export default class InvalidInvoiceLineError extends AppError {

  /**
   * @param {object} [params]
   * @param {string} [params.barcode]
   * @param {*} [params.price]
   * @param {*} [params.quantity]
   * @param {'quantity' | 'price' | 'line'} [params.problem]
   */
  constructor({barcode, price, quantity, problem} = {}) {
    const message = MESSAGE[problem] || 'Invoice line is not valid';
    super({
      code: ErrorCode.INVOICE_LINE_INVALID,
      message,
      userMessage: message,
      context: defined({barcode, price, quantity, problem, operation: 'issue'}),
      level: 'warn'
    });
  }

}
