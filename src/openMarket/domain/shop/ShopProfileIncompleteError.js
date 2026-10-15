import ErrorCode from '../error/ErrorCode.js';
import AppError from '../error/AppError.js';

/**
 * Invoicing is on, but the shop has no NIF or legal name yet.
 */
export default class ShopProfileIncompleteError extends AppError {
  constructor() {
    super({
      code: ErrorCode.SHOP_PROFILE_INCOMPLETE,
      message: 'The shop profile has no NIF or legal name',
      userMessage: 'Add the shop NIF and legal name in Settings',
      level: 'warn'
    });
  }
}
