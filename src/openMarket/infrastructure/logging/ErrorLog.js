import AppError from '../../domain/error/AppError.js';
import ErrorCode from '../../domain/error/ErrorCode.js';
import UnexpectedFailure from '../../domain/error/UnexpectedFailure.js';

const CAUSE_LIMIT = 8;

let writer = () => {};
let seen = new WeakSet();
let processType = 'main';
let bound = false;

/**
 * Writes one JSON line the first time an error object is seen.
 * A later catch of the same object does not write again.
 * Constructing an error does not log. Call record, raise, or observableError.
 * @param {*} error
 * @returns {Error}
 */
export function record(error) {
  const target = error instanceof Error
    ? error
    : new Error(error == null ? 'Unknown error' : String(error));
  if (seen.has(target)) {
    return target;
  }
  seen.add(target);
  try {
    writer(JSON.stringify(serialize(target)));
  } catch (writeError) {
    // A log failure must not replace the shop failure.
  }
  return target;
}

/**
 * Records the error, then throws it.
 * @param {Error} error
 */
export function raise(error) {
  throw record(error);
}

/**
 * Wraps a driver error with the operation that was in progress.
 * An AppError is thrown unchanged so it is not logged a second time.
 * @param {*} error
 * @param {string} [message]
 * @param {Object} [context]
 */
export function rethrow(error, {message, context} = {}) {
  if (error instanceof AppError) {
    throw error;
  }
  const cause = error instanceof Error
    ? error
    : new Error(error == null ? 'Unknown error' : String(error));
  const detail = cause.message || 'Unexpected failure';
  raise(new UnexpectedFailure({
    message: message ? `${message}: ${detail}` : detail,
    userMessage: detail,
    context,
    cause
  }));
}

/**
 * Toast text. Prefers the short userMessage over the diagnostic sentence.
 * @param {*} error
 * @param {string} fallback
 * @returns {string}
 */
export function userText(error, fallback) {
  if (error && typeof error.userMessage === 'string' && error.userMessage) {
    return error.userMessage;
  }
  if (error && typeof error.message === 'string' && error.message) {
    return error.message;
  }
  return fallback;
}

/**
 * One JSON object. The cause array starts at the direct cause and ends at the root.
 * @param {Error} error
 * @returns {Object}
 */
export function serialize(error) {
  const app = error instanceof AppError ? error : null;
  return {
    time: new Date().toISOString(),
    level: app ? app.level : 'error',
    code: app ? app.code : ErrorCode.UNEXPECTED,
    name: error && error.name ? error.name : 'Error',
    message: error && error.message ? error.message : String(error),
    context: app ? app.context : {},
    stack: error && error.stack ? error.stack : undefined,
    cause: causeChain(error && error.cause),
    process: processType,
    version: appVersion()
  };
}

/**
 * Installs the electron-log sink. The main process writes the file.
 * The renderer forwards lines to that file. A second call does nothing.
 * Tests never reach the file: NODE_ENV=test returns before electron-log is used.
 * @param {Object} imported
 * @param {'main'|'renderer'} [processType]
 */
export function bindLogger(imported, {processType: type = 'main'} = {}) {
  if (process.env.NODE_ENV === 'test') {
    return;
  }
  if (bound) {
    return;
  }
  bound = true;
  processType = type === 'renderer' ? 'renderer' : 'main';
  const log = loggerFrom(imported);
  if (processType === 'main') {
    if (typeof log.initialize === 'function') {
      log.initialize();
    }
    if (log.transports && log.transports.file) {
      log.transports.file.format = ({data}) => data;
    }
    if (log.eventLogger && typeof log.eventLogger.startLogging === 'function') {
      log.eventLogger.startLogging();
    }
  }
  writer = line => {
    log[levelOf(line)](line);
  };
  if (log.errorHandler && typeof log.errorHandler.startCatching === 'function') {
    log.errorHandler.startCatching({
      showDialog: false,
      onError({error}) {
        record(error);
        return false;
      }
    });
  }
}

/**
 * Points record at a writer. The unit test uses this instead of a log file.
 * @param {function(string): void} [write]
 */
export function start({write} = {}) {
  if (typeof write === 'function') {
    writer = write;
    seen = new WeakSet();
  }
}

/**
 * Drops the test writer so later tests do not append to it.
 */
export function resetForTest() {
  writer = () => {};
  seen = new WeakSet();
  bound = false;
  processType = 'main';
}

function causeChain(error) {
  const chain = [];
  const visited = new Set();
  let current = error;
  while (current && chain.length < CAUSE_LIMIT && !visited.has(current)) {
    visited.add(current);
    chain.push({
      name: current.name,
      message: current.message,
      code: current.code,
      stack: current.stack
    });
    current = current.cause;
  }
  return chain;
}

function levelOf(line) {
  try {
    const parsed = JSON.parse(line);
    if (parsed && parsed.level === 'warn') {
      return 'warn';
    }
  } catch (parseError) {
    return 'error';
  }
  return 'error';
}

function loggerFrom(imported) {
  if (imported && typeof imported.error === 'function') {
    return imported;
  }
  if (imported && imported.default && typeof imported.default.error === 'function') {
    return imported.default;
  }
  return imported;
}

function appVersion() {
  const version = process.env.OPENMARKET_VERSION;
  return typeof version === 'string' && version ? version : null;
}
