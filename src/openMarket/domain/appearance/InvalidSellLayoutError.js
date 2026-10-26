import ErrorCode from '../error/ErrorCode.js';
import AppError, {defined} from '../error/AppError.js';

/**
 * A sell-screen layout id is not one of the installed presets.
 */
export default class InvalidSellLayoutError extends AppError {
  /**
   * @param {object} [params]
   * @param {string} [params.layout]
   */
  constructor({layout} = {}) {
    super({
      code: ErrorCode.SELL_LAYOUT_INVALID,
      message: `Layout ${layout} is not valid`,
      userMessage: 'unknown layout',
      context: defined({layout}),
      level: 'warn'
    });
  }
}
