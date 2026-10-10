import ErrorCode from '../error/ErrorCode.js';
import AppError, {defined} from '../error/AppError.js';

/**
 * Delete was refused because the category still has products.
 */
export default class CategoryNotEmptyError extends AppError {

  /**
   * @param {string} id
   */
  constructor({id} = {}) {
    super({
      code: ErrorCode.CATEGORY_NOT_EMPTY,
      message: 'Category still has products',
      userMessage: 'Category still has products',
      context: defined({id, operation: 'delete'}),
      level: 'warn'
    });
  }

}
