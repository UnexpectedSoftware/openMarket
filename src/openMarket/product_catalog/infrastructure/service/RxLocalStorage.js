import Rx from 'rx';
import {LocalStorage} from 'node-localstorage';

export default class RxLocalStorage {

    static loadLocalStorage({localStorageKey}) {
        return Rx.Observable.create(observer => {
            let localStorage = new LocalStorage('./scratch');
            let data = localStorage.getItem(localStorageKey);
            if (null === data) {
                observer.onError(null);
            } else {
                observer.onNext(JSON.parse(data));
                observer.onCompleted();
            }
        });
    }

    static saveLocalStorage({localStorageKey, value}){
        return Rx.Observable.create(observer => {
            try{
                let localStorage = new LocalStorage('./scratch');
                localStorage.setItem(localStorageKey, JSON.stringify(value));
                observer.onNext(null);
                observer.onCompleted();
            }catch(error){
                observer.onError(error);
            }
        });
    }
}
