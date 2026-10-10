import ErrorCode from '../error/ErrorCode.js';
import AppError, {defined} from '../error/AppError.js';

const PHRASE = {
  rename: 'renaming it',
  replaceImage: 'replacing its image',
  clearImage: 'clearing its image',
  delete: 'deleting it'
};

/**
 * A category write did not match a row.
 */
export default class CategoryNotFoundError extends AppError {

  /**
   * @param {string} [id]
   * @param {string} [name]
   * @param {string} [operation]
   * @param {Error} [cause]
   */
  constructor({id, name, operation, cause} = {}) {
    const who = [id, name].filter(part => part != null && part !== '').join(' ') || 'unknown';
    const phrase = PHRASE[operation] || operation || 'updating it';
    super({
      code: ErrorCode.CATEGORY_NOT_FOUND,
      message: `Category ${who} was not found while ${phrase}`,
      userMessage: 'category not found',
      context: defined({id, name, operation}),
      cause,
      level: 'warn'
    });
  }

}
