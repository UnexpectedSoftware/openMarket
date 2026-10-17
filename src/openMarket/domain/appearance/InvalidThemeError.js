import ErrorCode from '../error/ErrorCode.js';
import AppError, {defined} from '../error/AppError.js';

/**
 * A theme id is not one of the four installed themes.
 */
export default class InvalidThemeError extends AppError {
  /**
   * @param {object} [params]
   * @param {string} [params.theme]
   */
  constructor({theme} = {}) {
    super({
      code: ErrorCode.THEME_INVALID,
      message: `Theme ${theme} is not valid`,
      userMessage: 'unknown theme',
      context: defined({theme}),
      level: 'warn'
    });
  }
}
