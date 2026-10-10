import ErrorCode from './ErrorCode.js';
import AppError from './AppError.js';

/**
 * The UI asked the container for a use case key that is not registered.
 */
export default class UnsupportedUseCaseError extends AppError {

  /**
   * @param {string} key
   */
  constructor({key} = {}) {
    super({
      code: ErrorCode.USE_CASE_UNKNOWN,
      message: `Unsupported UseCase ${key}`,
      userMessage: `Unsupported UseCase ${key}`,
      context: {key},
      level: 'error'
    });
  }

}
