import ErrorCode from '../error/ErrorCode.js';
import AppError, {defined} from '../error/AppError.js';

/**
 * A locale this till does not accept. The only stored locale is `es`.
 */
export default class InvalidLanguageError extends AppError {
  /**
   * @param {{locale?: string}} [params]
   */
  constructor({locale} = {}) {
    super({
      code: ErrorCode.LANGUAGE_INVALID,
      message: `Language ${locale} is not valid`,
      userMessage: 'invalid language',
      context: defined({locale}),
      level: 'warn'
    });
  }
}
