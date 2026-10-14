import ErrorCode from '../error/ErrorCode.js';
import AppError, {defined} from '../error/AppError.js';

/**
 * A line was added to an order that is already placed.
 */
export default class OrderAlreadyPlacedError extends AppError {

  /**
   * @param {object} [params]
   * @param {string} [params.id]
   */
  constructor({id} = {}) {
    super({
      code: ErrorCode.ORDER_ALREADY_PLACED,
      message: 'Order is already placed',
      userMessage: 'Order is already placed',
      context: defined({id, operation: 'addLine'}),
      level: 'warn'
    });
  }

}
