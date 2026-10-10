import ErrorCode from './ErrorCode.js';

/**
 * Copies the fields that were actually supplied. Logs stay free of nulls.
 * @param {Object} [fields]
 * @returns {Object}
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
   * @param {string} code
   * @param {string} message
   * @param {string} [userMessage]
   * @param {Object} [context]
   * @param {Error} [cause]
   * @param {'warn'|'error'} [level]
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
