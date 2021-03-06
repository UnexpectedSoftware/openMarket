/**
 * @class LocalStorageCategoryRepository
 * @implements {CategoryRepository}
 */
import CategoryRepository from '../../domain/category/CategoryRepository';
import RxLocalStorage from '../service/RxLocalStorage';
import {CATEGORIES_KEY} from '../service/LocalStorageKeys';
import { Observable } from 'rxjs/Observable';
import * as Rx from "rxjs";


export default class LocalStorageCategoryRepository extends CategoryRepository {

    /**
     * @constructor
     * @param {CategoryFactory} categoryFactory
     */
  constructor({ categoryFactory }) {
    super();
    this._localStorageKey = CATEGORIES_KEY;
        /**
         * @member LocalStorageCategoryRepository#categoryFactory
         */
    this._categoryFactory = categoryFactory;
  }

    /**
     *
     * @returns {Observable.<Array<Category>>}
     */
  findAll() {
    return RxLocalStorage.loadLocalStorage({ localStorageKey: this._localStorageKey })
      .catch(Rx.Observable.of([]))
      .flatMap(arrayData => Observable.from(arrayData))
      .map(data => this._categoryFactory.createWithId({
        id: data._id,
        name: data._name
      }))
      .toArray();
  }

    /**
     *
     * @param {string} id
     * @returns {Observable.<Category>}
     */
  findById({ id }) {
    return RxLocalStorage.loadLocalStorage({ localStorageKey: this._localStorageKey })
      .catch(Rx.Observable.of([]))
      .flatMap(arrayData => Observable.from(arrayData))
      .filter(category => category._id === id)
      .map(category => this._categoryFactory.createWithId({
        id: category._id,
        name: category._name
      }));
  }


    /**
     *
     * @param name
     * @param imageUrl
     * @returns {Observable<null>}
     */
  save({ name }) {
    const category = this._categoryFactory.createWith({name});
    return RxLocalStorage.loadLocalStorage({ localStorageKey: this._localStorageKey })
        .catch(Rx.Observable.of([]))
        .map(categoryArray => {
          categoryArray.push(category);
          return categoryArray;
        })
        .flatMap(categoryArray => RxLocalStorage.saveLocalStorage({ localStorageKey: this._localStorageKey, value: categoryArray }));
  }

    /**
     *
     * @param {string} id
     * @param {string} name
     * @returns {Observable<null>}
     */
  update({ id, name }) {
    return RxLocalStorage.loadLocalStorage({ localStorageKey: this._localStorageKey })
            .catch(e => Rx.Observable.of([]))
            .map(categoryArray => {
              const optionalIndex = categoryArray.findIndex((category, index, array) => (category._id === id));
              if (optionalIndex !== -1) {
                categoryArray[optionalIndex]._name = name;
              } else {
                throw new Error('category not found');
              }
              return categoryArray;
            })
            .flatMap(categoryArray => RxLocalStorage.saveLocalStorage({ localStorageKey: this._localStorageKey, value: categoryArray }));
  }

}
