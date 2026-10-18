import ErrorCode from '../error/ErrorCode.js';
import AppError, {defined} from '../error/AppError.js';

/**
 * A line cannot be added: the quantity is not a positive number,
 * a whole-unit product has a fraction, or a free-amount line is not a positive amount.
 */
export default class InvalidOrderLineError extends AppError {

  /**
   * @param {object} [params]
   * @param {*} [params.quantity]
   * @param {string} [params.barcode]
   * @param {string} [params.reason]
   */
  constructor({quantity, barcode, reason} = {}) {
    const quantityProblem = reason === ErrorCode.ORDER_QUANTITY_INVALID;
    super({
      code: ErrorCode.ORDER_LINE_INVALID,
      message: quantityProblem
        ? 'Quantity must be greater than 0'
        : 'The order line is not valid',
      userMessage: quantityProblem
        ? 'Quantity must be greater than 0'
        : 'Cantidad no válida',
      context: defined({quantity, barcode, reason, operation: 'addLine'}),
      level: 'warn'
    });
  }

}
