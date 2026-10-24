import * as Rx from 'rxjs';
import {rethrow} from '../logging/ErrorLog';

const FIND_SQL = 'SELECT value_json FROM setting WHERE key = ?';

/**
 * The JSON text stored for one setting key, or null when the row is missing.
 * @param {{database: {prepare: Function}, key: string, message: string}} params
 * @returns {string | null}
 */
export default function readSettingText({database, key, message}) {
  let row;
  try {
    row = database.prepare(FIND_SQL).get(key);
  } catch (error) {
    rethrow(error, {message, context: {operation: 'find'}});
  }
  return row ? row.value_json : null;
}

/**
 * One JSON setting, mapped when the row exists and replaced by `missing` when it does not.
 * @param {{prepare: Function}} database
 * @param {string} key
 * @param {string} message
 * @param {Function} present
 * @param {Function} missing
 * @returns {import('rxjs/Observable').Observable<any>}
 */
export function loadSetting(database, key, message, present, missing) {
  return Rx.Observable.defer(() => {
    const text = readSettingText({database, key, message});
    return Rx.Observable.of(text == null ? missing() : present(text));
  });
}
