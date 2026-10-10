import ErrorCode from '../error/ErrorCode.js';
import AppError, {defined} from '../error/AppError.js';

const PHRASE = {
  updateImage: 'updating its image',
  disable: 'disabling it',
  enable: 'enabling it',
  addStock: 'adding stock'
};

/**
 * A command that needs a product row did not find one.
 * Scanning a barcode on New Order is not this error: that lookup stays empty
 * so the cashier can create the product.
 */
export default class ProductNotFoundError extends AppError {

  /**
   * @param {string} [barcode]
   * @param {string} [id]
   * @param {string} [name]
   * @param {string} [operation]
   * @param {Error} [cause]
   */
  constructor({barcode, id, name, operation, cause} = {}) {
    const who = [barcode, name].filter(part => part != null && part !== '').join(' ') || 'unknown';
    const phrase = PHRASE[operation] || operation || 'looking it up';
    super({
      code: ErrorCode.PRODUCT_NOT_FOUND,
      message: `Product ${who} was not found while ${phrase}`,
      userMessage: 'product not found',
      context: defined({barcode, id, name, operation}),
      cause,
      level: 'warn'
    });
  }

}
