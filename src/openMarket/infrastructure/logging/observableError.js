import * as Rx from 'rxjs';
import {record} from './ErrorLog';

/**
 * Records the error, then fails the observable with the same object.
 * @param {Error} error
 * @returns {Observable}
 */
export default function observableError(error) {
  return Rx.Observable.throw(record(error));
}
