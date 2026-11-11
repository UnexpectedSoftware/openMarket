import ErrorCode from '../error/ErrorCode.js';
import AppError, {defined} from '../error/AppError.js';

const USER_MESSAGES = Object.freeze({
  barcode: 'Falta el código de barras',
  name: 'Falta el nombre del producto',
  price: 'Falta el precio'
});

/**
 * A product cannot be created without a barcode, a name, or a price.
 */
export default class InvalidProductError extends AppError {

  /**
   * @param {object} params
   * @param {'barcode' | 'name' | 'price'} params.field
   * @param {string} [params.barcode]
   */
  constructor({field, barcode}) {
    super({
      code: ErrorCode.PRODUCT_INVALID,
      message: 'Product ' + field + ' is missing',
      userMessage: USER_MESSAGES[field],
      context: defined({field, barcode, operation: 'createProduct'}),
      level: 'warn'
    });
  }

}
