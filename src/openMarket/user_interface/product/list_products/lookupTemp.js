import fs from 'fs';
import os from 'os';
import path from 'path';

let fetchedTemp = null;

/**
 * A downloaded lookup file lives in the OS temp dir and is named openfoodfacts-*.
 * @param {string | null | undefined} imagePath
 */
export function unlinkFetchedTemp(imagePath) {
  if (!imagePath || typeof imagePath !== 'string') {
    return;
  }
  if (path.basename(imagePath).indexOf('openfoodfacts-') !== 0) {
    return;
  }
  if (path.resolve(path.dirname(imagePath)) !== path.resolve(os.tmpdir())) {
    return;
  }
  try {
    fs.unlinkSync(imagePath);
  } catch (unlinkError) {
    // The copy already succeeded, or a cancelled lookup never wrote the file.
  }
}

/** @param {string | null | undefined} imagePath */
export function rememberFetched(imagePath) {
  if (fetchedTemp && fetchedTemp !== imagePath) {
    unlinkFetchedTemp(fetchedTemp);
  }
  fetchedTemp = imagePath || null;
}

export function forgetFetched() {
  unlinkFetchedTemp(fetchedTemp);
  fetchedTemp = null;
}
