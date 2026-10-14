import ErrorCode from './ErrorCode.js';

/**
 * Copies the fields that were actually supplied. Logs stay free of nulls.
 * @param {Record<string, any>} [fields]
 * @returns {Record<string, any>}
 */
export function defined(fields) {
  const context = {};
  if (!fields) {
    return context;
  }
  Object.keys(fields).forEach(key => {
    if (fields[key] !== undefined && fields[key] !== null) {
      context[key] = fields[key];
    }
  });
  return context;
}

/**
 * Operational failure. `message` is the diagnostic sentence for the log.
 * `userMessage` is the short text a toast already shows.
 * `cause` is a lower error, only when one actually produced this failure.
 */
export default class AppError extends Error {

  /**
   * @param {object} [params]
   * @param {string} [params.code]
   * @param {string} [params.message]
   * @param {string} [params.userMessage]
   * @param {Record<string, any>} [params.context]
   * @param {Error} [params.cause]
   * @param {'warn' | 'error'} [params.level]
   */
  constructor({code, message, userMessage, context, cause, level} = {}) {
    super(message, cause ? {cause} : undefined);
    this.name = this.constructor.name;
    this.code = code || ErrorCode.UNEXPECTED;
    this.userMessage = userMessage || message;
    this.context = defined(context);
    this.level = level === 'warn' ? 'warn' : 'error';
    if (typeof Error.captureStackTrace === 'function') {
      Error.captureStackTrace(this, new.target);
    }
  }

}
