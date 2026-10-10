import ErrorCode from './ErrorCode.js';
import AppError from './AppError.js';

/**
 * A second thermal job arrived while the shared printer buffer is still in use.
 */
export default class PrinterBusyError extends AppError {

  constructor() {
    super({
      code: ErrorCode.PRINTER_BUSY,
      message: 'Printer is busy',
      userMessage: 'Printer is busy',
      context: {operation: 'print'},
      level: 'warn'
    });
  }

}
