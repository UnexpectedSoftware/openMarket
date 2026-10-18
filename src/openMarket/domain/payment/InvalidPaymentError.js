import ErrorCode from '../error/ErrorCode.js';
import AppError, {defined} from '../error/AppError.js';

/**
 * A payment does not cover the order, or the method and the change disagree.
 */
export default class InvalidPaymentError extends AppError {

  /**
   * @param {object} [params]
   * @param {'cash' | 'card' | string} [params.method]
   * @param {number} [params.tenderedCents]
   * @param {number} [params.changeCents]
   * @param {number} [params.totalCents]
   */
  constructor({method, tenderedCents, changeCents, totalCents} = {}) {
    const short = method === 'cash'
      && Number.isInteger(tenderedCents)
      && Number.isInteger(totalCents)
      && tenderedCents < totalCents;
    super({
      code: ErrorCode.PAYMENT_INVALID,
      message: short
        ? 'Tendered cash does not cover the total'
        : 'The payment is not valid',
      userMessage: short ? 'Entregado insuficiente' : 'El pago no es válido',
      context: defined({method, tenderedCents, changeCents, totalCents, operation: 'pay'}),
      level: 'warn'
    });
  }

}
