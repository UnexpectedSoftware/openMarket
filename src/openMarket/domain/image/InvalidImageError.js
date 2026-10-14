import AppError, {defined} from '../error/AppError.js';

/**
 * The chosen file is missing, empty, too large, or not a JPEG, PNG, GIF, or WebP.
 * `userMessage` stays the sentence the form already shows. A filesystem error,
 * when there is one, is `cause`.
 */
export default class InvalidImageError extends AppError {

  /**
   * @param {object} [params]
   * @param {string} [params.code]
   * @param {string} [params.userMessage]
   * @param {Record<string, any>} [params.context]
   * @param {Error} [params.cause]
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
