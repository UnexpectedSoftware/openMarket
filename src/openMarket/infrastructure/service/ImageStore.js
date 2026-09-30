import fs from 'fs';
import path from 'path';
import sqliteDatabasePath from './sqliteDatabasePath';

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
      throw new Error('ImageStore requires a directory');
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
      throw new Error('Choose an image file');
    }
    if (!stat.isFile() || stat.size <= 0) {
      throw new Error('Choose an image file');
    }
    if (stat.size > IMAGE_MAX_BYTES) {
      throw new Error('Image must be 5 MB or smaller');
    }
    const extension = path.extname(sourcePath).toLowerCase();
    if (!TYPES[extension]) {
      throw new Error('Use a JPEG, PNG, GIF, or WebP image');
    }
    const safeId = path.basename(String(id));
    if (!safeId || safeId === '.' || safeId === '..') {
      throw new Error('Choose an image file');
    }
    const imageName = safeId + extension;
    fs.mkdirSync(this._directory, {recursive: true});
    fs.copyFileSync(sourcePath, path.join(this._directory, imageName));
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
