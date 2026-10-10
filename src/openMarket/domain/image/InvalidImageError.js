import AppError, {defined} from '../error/AppError.js';

/**
 * The chosen file is missing, empty, too large, or not a JPEG, PNG, GIF, or WebP.
 * `userMessage` stays the sentence the form already shows. A filesystem error,
 * when there is one, is `cause`.
 */
export default class InvalidImageError extends AppError {

  /**
   * @param {string} code
   * @param {string} userMessage
   * @param {Object} [context]
   * @param {Error} [cause]
   */
  constructor({code, userMessage, context, cause} = {}) {
    super({
      code,
      message: userMessage,
      userMessage,
      context: defined(context),
      cause,
      level: 'warn'
    });
  }

}
