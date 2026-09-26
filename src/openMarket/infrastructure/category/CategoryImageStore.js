import fs from 'fs';
import path from 'path';
import sqliteDatabasePath from '../service/sqliteDatabasePath';

export const CATEGORY_IMAGE_MAX_BYTES = 5 * 1024 * 1024;

const TYPES = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.webp': 'image/webp'
};

export function categoryImagesDirectory() {
  return path.join(path.dirname(sqliteDatabasePath()), 'category-images');
}

/**
 * Copies a category image into the app data directory and reads it back.
 */
export default class CategoryImageStore {
  constructor({directory} = {}) {
    this._directory = directory || categoryImagesDirectory();
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
    if (stat.size > CATEGORY_IMAGE_MAX_BYTES) {
      throw new Error('Image must be 5 MB or smaller');
    }
    const extension = path.extname(sourcePath).toLowerCase();
    if (!TYPES[extension]) {
      throw new Error('Use a JPEG, PNG, GIF, or WebP image');
    }
    const safeId = path.basename(String(id));
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
    try {
      const filePath = this._filePath(imageName);
      if (!filePath || !fs.existsSync(filePath)) {
        return null;
      }
      const mime = TYPES[path.extname(filePath).toLowerCase()];
      if (!mime) {
        return null;
      }
      const encoded = fs.readFileSync(filePath).toString('base64');
      return `data:${mime};base64,${encoded}`;
    } catch (error) {
      return null;
    }
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
