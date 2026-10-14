import ErrorCode from '../error/ErrorCode.js';
import AppError, {defined} from '../error/AppError.js';

/**
 * A sync subscriber ran while no transaction was open, so its writes could not
 * roll back with the fact that caused them.
 */
export default class SyncSubscriberOutsideTransactionError extends AppError {

  /**
   * @param {object} [params]
   * @param {string} [params.type]
   */
  constructor({type} = {}) {
    super({
      code: ErrorCode.SYNC_SUBSCRIBER_OUTSIDE_TRANSACTION,
      message: `Sync subscriber for ${type || 'a domain event'} ran outside a transaction`,
      userMessage: 'This change could not be saved',
      context: defined({type}),
      level: 'error'
    });
  }

}
