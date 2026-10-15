import ErrorCode from '../error/ErrorCode.js';
import AppError, {defined} from '../error/AppError.js';

/**
 * An order cannot be placed when a line quantity is missing, not a number, or not greater than zero.
 */
export default class InvalidOrderQuantityError extends AppError {

  /**
   * @param {object} [params]
   * @param {*} [params.quantity]
   * @param {string} [params.barcode]
   */
  constructor({quantity, barcode} = {}) {
    super({
      code: ErrorCode.ORDER_QUANTITY_INVALID,
      message: 'Quantity must be greater than 0',
      userMessage: 'Quantity must be greater than 0',
      context: defined({quantity, barcode, operation: 'create'}),
      level: 'warn'
    });
  }

}
