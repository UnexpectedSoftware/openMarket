import ErrorCode from '../error/ErrorCode.js';
import AppError from '../error/AppError.js';

/**
 * An image store was built without a directory to write into.
 */
export default class ImageStoreMisconfiguredError extends AppError {

  constructor() {
    super({
      code: ErrorCode.IMAGE_STORE_MISCONFIGURED,
      message: 'ImageStore requires a directory',
      userMessage: 'ImageStore requires a directory',
      level: 'error'
    });
  }

}
