import ErrorCode from './ErrorCode.js';
import AppError from './AppError.js';

/**
 * An order or sale date was not one of the formats the store accepts.
 */
export default class UnrecognisedDateError extends AppError {

  /**
   * @param {*} value
   */
  constructor({value} = {}) {
    super({
      code: ErrorCode.DATE_UNRECOGNISED,
      message: 'Unrecognised date ' + value,
      userMessage: 'Unrecognised date ' + value,
      context: {value: value == null ? null : String(value)},
      level: 'error'
    });
  }

}
