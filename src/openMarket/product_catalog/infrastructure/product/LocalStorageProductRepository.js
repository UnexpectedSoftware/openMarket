import ProductRepository from '../../domain/product/ProductRepository';
import RxLocalStorage from "../service/RxLocalStorage";
import Rx from 'rx';

const localStorageKey = 'products';
export default class LocalStorageProductRepository extends ProductRepository {
    constructor(){
        super();
    }

    findAll({productFilter}){
        return RxLocalStorage.loadLocalStorage({localStorageKey: localStorageKey})
            .flatMap(products => {
                return Rx.Observable.from(products.slice(productFilter.offset,productFilter.limit));
            });
    }

    findAllByName({name,limit,offset}){
        return null;
    }
    //TODO Make an abstract LocalStorageRepository with methods like this
    save({product}){
        return RxLocalStorage.saveLocalStorage({localStorageKey: localStorageKey, value:product});
    }

}
