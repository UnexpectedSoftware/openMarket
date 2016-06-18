import ProductRepository from '../../domain/product/ProductRepository';
import RxLocalStorage from "../service/RxLocalStorage";
import Rx from 'rx';

const localStorageKey = 'products';
/**
 * @class LocalStorageProductRepository
 * @implements {ProductRepository}
 */
export default class LocalStorageProductRepository extends ProductRepository {
    /**
     * @constructs LocalStorageProductRepository
     */
    constructor(){
        super();
    }

    /**
     *
     * @param {ProductFilter} productFilter
     * @returns {Observable<Product>}
     */
    findAll({productFilter}){
        return RxLocalStorage.loadLocalStorage({localStorageKey: localStorageKey})
            .flatMap(products => {
                return Rx.Observable.from(products.slice(productFilter.offset,productFilter.limit));
            });
    }

    /**
     *
     * @param {string} name
     * @param {number} limit
     * @param {number} offset
     * @returns {Observable.<Product>}
     */
    findAllByName({name,limit,offset}){
        return RxLocalStorage.loadLocalStorage({localStorageKey: localStorageKey})
            .flatMap(products => {
                return Rx.Observable.from(products);
            })
            .filter(product => product.name === name)
            ;
    }
    //TODO Make an abstract LocalStorageRepository with methods like this
    /**
     *
     * @param {Product} product
     * @returns {Observable.<null>}
     */
    save({product}){
        return RxLocalStorage.saveLocalStorage({localStorageKey: localStorageKey, value:product});
    }

}
