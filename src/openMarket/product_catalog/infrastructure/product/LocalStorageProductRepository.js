import ProductRepository from '../../domain/product/ProductRepository';
import RxLocalStorage from "../service/RxLocalStorage";
import Rx from 'rx';
import * as _ from "lodash";

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
        return RxLocalStorage.loadLocalStorage({localStorageKey: localStorageKey})
            .map(arrayProducts => {
                var index = _.indexOf(arrayProducts, _.find(arrayProducts,{barcode: product.barcode}));
                if(index!=-1){
                    arrayProducts.splice(index, 1, product);
                }else{
                    arrayProducts.push(product);
                }
                return arrayProducts;
            })
            .flatMap(arrayProducts => RxLocalStorage.saveLocalStorage({localStorageKey: localStorageKey, value:arrayProducts}))

            ;
    }

    saveCollection({arrayProducts}){
        return RxLocalStorage.saveLocalStorage({
            localStorageKey: localStorageKey,
            value: arrayProducts
        });
    }

    findById({id}){
        return RxLocalStorage.loadLocalStorage({localStorageKey: localStorageKey})
            .flatMap(products => {
                return Rx.Observable.from(products);
            })
            .filter(product => product.id === id)
            ;
    }

    findByBarcode({barcode}){
        return RxLocalStorage.loadLocalStorage({localStorageKey: localStorageKey})
            .flatMap(products => {
                return Rx.Observable.from(products);
            })
            .filter(product => product.barcode === barcode)
            ;
    }

    addStock({barcode,quantity}){
        return this.findByBarcode({barcode})
            .map(product => {
                product.stock += quantity;
                return product;
            })
            .flatMap(product => this.save({product}));
    }



}
