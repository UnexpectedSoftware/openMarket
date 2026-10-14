import ErrorCode from '../error/ErrorCode.js';
import AppError, {defined} from '../error/AppError.js';

/**
 * An invoice was asked for an order that is not stored.
 */
export default class InvoiceOrderNotFoundError extends AppError {

  /**
   * @param {object} [params]
   * @param {string} [params.orderId]
   */
  constructor({orderId} = {}) {
    super({
      code: ErrorCode.INVOICE_ORDER_NOT_FOUND,
      message: `Order ${orderId || 'unknown'} was not found while issuing an invoice`,
      userMessage: 'Order not found',
      context: defined({orderId, operation: 'issue'}),
      level: 'warn'
    });
  }

}
