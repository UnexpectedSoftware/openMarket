import Rx from 'rx';
import { LocalStorage } from 'node-localstorage';
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
      const localStorage = new LocalStorage('./scratch');
      const data = localStorage.getItem(localStorageKey);
      if (data === null) {
        observer.onError(null);
      } else {
        observer.onNext(JSON.parse(data));
        observer.onCompleted();
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
        const localStorage = new LocalStorage('./scratch');
        localStorage.setItem(localStorageKey, JSON.stringify(value));
        observer.onNext(null);
        observer.onCompleted();
      } catch (error) {
        observer.onError(error);
      }
    });
  }
}
