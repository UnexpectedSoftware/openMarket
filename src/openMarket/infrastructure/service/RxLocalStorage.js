import Rx from 'rxjs/Rx';
import { LocalStorage } from 'node-localstorage';
import  os from 'os';
/**
 * @class
 */
export default class RxLocalStorage {

    /**
     * @param {string} localStorageKey
     * @returns {Observable<Array>}
     */
  static loadLocalStorage({ localStorageKey }) {
    return Rx.Observable.create(observer => {
      const localStorage = new LocalStorage(os.tmpdir());
      const data = localStorage.getItem(localStorageKey);
      if ("" === data || null === data) {
        observer.error("");
      } else {
        observer.next(JSON.parse(data));
        observer.complete();
      }
    });
  }

    /**
     * @param {string} localStorageKey
     * @param {string} value
     * @returns {Observable<null>}
     */
  static saveLocalStorage({ localStorageKey, value }) {
    return Rx.Observable.create(observer => {
      try {
        const localStorage = new LocalStorage(os.tmpdir());
        localStorage.setItem(localStorageKey, JSON.stringify(value));
        observer.next(null);
        observer.complete();
      } catch (error) {
        observer.error(error);
      }
    });
  }
}
