import ErrorCode from '../error/ErrorCode.js';
import AppError, {defined} from '../error/AppError.js';

/**
 * A catalog or image page was asked for with a limit, offset, or cursor
 * the query cannot use.
 */
export default class InvalidProductPageError extends AppError {

  /**
   * @param {number} [limit]
   * @param {number} [offset]
   * @param {string} [operation]
   * @param {string} [barcode]
   * @param {string} [name]
   */
  constructor({limit, offset, operation, barcode, name} = {}) {
    super({
      code: ErrorCode.INVALID_PRODUCT_PAGE,
      message: 'Invalid product page',
      userMessage: 'Invalid product page',
      context: defined({limit, offset, operation, barcode, name}),
      level: 'warn'
    });
  }

}
