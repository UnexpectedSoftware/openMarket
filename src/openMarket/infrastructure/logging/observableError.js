import * as Rx from 'rxjs';
import {record} from './ErrorLog';
/** @import { ErrorObservable } from 'rxjs/observable/ErrorObservable' */

/**
 * Records the error, then fails the observable with the same object.
 * @param {Error} error
 * @returns {ErrorObservable}
 */
export default function observableError(error) {
  return Rx.Observable.throw(record(error));
}
