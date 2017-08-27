/**
 * @class LocalStorageProductRepository
 * @implements {ProductRepository}
 */
import { Observable } from 'rxjs/Observable';
import * as _ from 'lodash';
import ProductRepository from '../../domain/product/ProductRepository';
import RxLocalStorage from '../service/RxLocalStorage';
import {PRODUCTS_KEY} from '../service/LocalStorageKeys';

import Product from "../../domain/product/Product";
import * as Rx from "rxjs";
import ProductStatus from "../../domain/product/ProductStatus";

const localStorageKey = 'products';
export default class LocalStorageProductRepository extends ProductRepository {

  /**
   *
   * @param {ProductMapper} productMapper
   */
  constructor({ productMapper }) {
    super();
    this._localStorageKey = PRODUCTS_KEY;
    this._productMapper = productMapper;
  }

    /**
     *
     * @param {ProductFilter} productFilter
     * @returns {Observable<Array<Product>>}
     */
  findAll({ productFilter }) {
    return RxLocalStorage.loadLocalStorage({ localStorageKey: this._localStorageKey })
      .flatMap(products =>
        Observable.from(
          products.slice(
            productFilter.offset,
            productFilter.offset + productFilter.limit
          )
        )
      )
      .map(jsonProduct => this._productMapper.toDomain({ jsonProduct }))
      .toArray();
  }

    /**
     *
     * @param {string} name
     * @param {number} limit
     * @param {number} offset
     * @returns {Observable.<Array<Product>>}
     */
  findAllByName({ name, limit, offset }) {
    return RxLocalStorage.loadLocalStorage({ localStorageKey: this._localStorageKey })
            .flatMap(products => Observable.from(products))
            .map(jsonProduct => this._productMapper.toDomain({ jsonProduct }))
            .filter(product => product.name.includes(name))
            .toArray()
            .map(products => products.slice(
              offset,
              offset + limit
            ));
  }


  findAllWithLowStock({ limit, offset }){
    return RxLocalStorage.loadLocalStorage({ localStorageKey: this._localStorageKey })
      .flatMap(products => Observable.from(products))
      .map(jsonProduct => this._productMapper.toDomain({ jsonProduct }))
      .filter(product => product.stock <= product.stockMin)
      .toArray()
      .map(products => products.slice(
        offset,
        offset + limit
      ));
  }

    // TODO Make an abstract LocalStorageRepository with methods like this
    /**
     *
     * @param {Product} product
     * @returns {Observable.<null>}
     */
  save({ product }) {
    return RxLocalStorage.loadLocalStorage({ localStorageKey: this._localStorageKey })
      .catch(e => Rx.Observable.of([]))
            .map(arrayProducts => {
              const index = _.indexOf(
                arrayProducts,
                _.find(arrayProducts, { _barcode: product.barcode })
              );
              if (index !== -1) {
                arrayProducts.splice(index, 1, product);
              } else {
                arrayProducts.push(product);
              }
              return arrayProducts;
            })
            .flatMap(arrayProducts =>
              RxLocalStorage.saveLocalStorage(
                { localStorageKey: this._localStorageKey,
                  value: arrayProducts
                }
                )
            );
  }

  /**
   *
   * @param {string} id
   * @returns {Observable.<Product>}
   */
  findById({ id }) {
    return RxLocalStorage.loadLocalStorage({ localStorageKey: this._localStorageKey })
            .flatMap(products => Observable.from(products))
            .map(jsonProduct => this._productMapper.toDomain({ jsonProduct }))
            .filter(product => product.id === id);
  }
  /**
   *
   * @param {string} barcode
   * @returns {Observable.<Product>}
   */
  findByBarcode({ barcode }) {
    return RxLocalStorage.loadLocalStorage({ localStorageKey: this._localStorageKey })
            .flatMap(products => Observable.from(products))
            .map(jsonProduct => this._productMapper.toDomain({ jsonProduct }))
            .filter(product => product.barcode === barcode);
  }

  findAllStatuses(){
    let statuses = [];
    for (var [key, value] of Object.entries(ProductStatus)) {
      statuses.push({key:key,value:value});
    }
    return Rx.Observable.of(statuses);
  }


  countProducts(){
    return RxLocalStorage.loadLocalStorage({ localStorageKey: this._localStorageKey })
      .flatMap(products => Observable.from(products))
      .map(jsonProduct => this._productMapper.toDomain({ jsonProduct }))
      .count();
  }

  countProductsByName(){
    return RxLocalStorage.loadLocalStorage({ localStorageKey: this._localStorageKey })
      .flatMap(products => Observable.from(products))
      .map(jsonProduct => this._productMapper.toDomain({ jsonProduct }))
      .filter(product => product.name.includes(name))
      .count();
  }


  countProductsWithLowStock(){
    return RxLocalStorage.loadLocalStorage({ localStorageKey: this._localStorageKey })
      .flatMap(products => Observable.from(products))
      .map(jsonProduct => this._productMapper.toDomain({ jsonProduct }))
      .filter(product => product.stock <= product.stockMin)
      .count();
  }


}
