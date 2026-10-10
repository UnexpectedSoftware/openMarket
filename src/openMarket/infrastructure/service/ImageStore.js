import fs from 'fs';
import path from 'path';
import sqliteDatabasePath from './sqliteDatabasePath';
import ErrorCode from '../../domain/error/ErrorCode';
import InvalidImageError from '../../domain/image/InvalidImageError';
import ImageStoreMisconfiguredError from '../../domain/image/ImageStoreMisconfiguredError';
import {raise, rethrow} from '../logging/ErrorLog';

export const IMAGE_MAX_BYTES = 5 * 1024 * 1024;

const TYPES = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.webp': 'image/webp'
};

export function imagesDirectory(folderName) {
  return path.join(path.dirname(sqliteDatabasePath()), folderName);
}

/**
 * Reads one image file as a data URL. Paths outside an ImageStore directory are allowed
 * so a downloaded temp file can be previewed. The type and size rules match store().
 * @param {?string} filePath
 * @returns {?string}
 */
export function dataUrlForFile(filePath) {
  try {
    if (!filePath || typeof filePath !== 'string') {
      return null;
    }
    const mime = TYPES[path.extname(filePath).toLowerCase()];
    if (!mime) {
      return null;
    }
    const stat = fs.statSync(filePath);
    if (!stat.isFile() || stat.size <= 0 || stat.size > IMAGE_MAX_BYTES) {
      return null;
    }
    return `data:${mime};base64,${fs.readFileSync(filePath).toString('base64')}`;
  } catch (error) {
    return null;
  }
}

/**
 * Copies an image into one app-data folder and reads it back.
 * Callers pass the folder so categories and products do not share files.
 */
export default class ImageStore {
  constructor({directory}) {
    if (!directory) {
      raise(new ImageStoreMisconfiguredError());
    }
    this._directory = directory;
  }

  /**
   * @param {string} id
   * @param {string} sourcePath
   * @returns {string} stored filename
   */
  store({id, sourcePath}) {
    let stat;
    try {
      stat = fs.statSync(sourcePath);
    } catch (error) {
      raise(new InvalidImageError({
        code: ErrorCode.IMAGE_FILE_INVALID,
        userMessage: 'Choose an image file',
        context: {id, sourcePath, operation: 'store'},
        cause: error
      }));
    }
    if (!stat.isFile() || stat.size <= 0) {
      raise(new InvalidImageError({
        code: ErrorCode.IMAGE_FILE_INVALID,
        userMessage: 'Choose an image file',
        context: {id, sourcePath, operation: 'store'}
      }));
    }
    if (stat.size > IMAGE_MAX_BYTES) {
      raise(new InvalidImageError({
        code: ErrorCode.IMAGE_FILE_TOO_LARGE,
        userMessage: 'Image must be 5 MB or smaller',
        context: {id, sourcePath, operation: 'store'}
      }));
    }
    const extension = path.extname(sourcePath).toLowerCase();
    if (!TYPES[extension]) {
      raise(new InvalidImageError({
        code: ErrorCode.IMAGE_TYPE_UNSUPPORTED,
        userMessage: 'Use a JPEG, PNG, GIF, or WebP image',
        context: {id, sourcePath, operation: 'store'}
      }));
    }
    const safeId = path.basename(String(id));
    if (!safeId || safeId === '.' || safeId === '..') {
      raise(new InvalidImageError({
        code: ErrorCode.IMAGE_FILE_INVALID,
        userMessage: 'Choose an image file',
        context: {id, operation: 'store'}
      }));
    }
    const imageName = safeId + extension;
    try {
      fs.mkdirSync(this._directory, {recursive: true});
      fs.copyFileSync(sourcePath, path.join(this._directory, imageName));
    } catch (error) {
      rethrow(error, {
        message: 'Could not store the image',
        context: {id: safeId, operation: 'store'}
      });
    }
    return imageName;
  }

  remove(imageName) {
    const filePath = this._filePath(imageName);
    if (!filePath || !fs.existsSync(filePath)) {
      return;
    }
    fs.unlinkSync(filePath);
  }

  /**
   * @param {?string} imageName
   * @returns {?string} data URL, or null when the file is missing
   */
  readDataUrl(imageName) {
    return dataUrlForFile(this._filePath(imageName));
  }

  _filePath(imageName) {
    if (!imageName || typeof imageName !== 'string') {
      return null;
    }
    if (path.basename(imageName) !== imageName) {
      return null;
    }
    const extension = path.extname(imageName).toLowerCase();
    if (!TYPES[extension]) {
      return null;
    }
    return path.join(this._directory, imageName);
  }
}
