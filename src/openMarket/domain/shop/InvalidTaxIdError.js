import ErrorCode from '../error/ErrorCode.js';
import AppError, {defined} from '../error/AppError.js';

/**
 * A NIF, NIE, or CIF failed the control check.
 */
export default class InvalidTaxIdError extends AppError {
  /**
   * @param {object} [params]
   * @param {string} [params.nif]
   */
  constructor({nif} = {}) {
    super({
      code: ErrorCode.TAX_ID_INVALID,
      message: `Tax id ${nif} is not valid`,
      userMessage: 'invalid NIF',
      context: defined({nif}),
      level: 'warn'
    });
  }
}
