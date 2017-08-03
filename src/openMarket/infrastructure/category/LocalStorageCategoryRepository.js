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
    this.categoryFactory = categoryFactory;
  }

    /**
     *
     * @returns {Observable.<Array<Category>>}
     */
  findAll() {
    return RxLocalStorage.loadLocalStorage({ localStorageKey: this._localStorageKey });
  }

    /**
     *
     * @param {string} id
     * @returns {Observable.<Category>}
     */
  findById({ id }) {
    return RxLocalStorage.loadLocalStorage({ localStorageKey: this._localStorageKey })
            .flatMap(arrayData => Observable.from(arrayData))
            .filter(category => category.id === id)
            ;
  }


    /**
     *
     * @param name
     * @param imageUrl
     * @returns {Observable<null>}
     */
  save({ name, imageUrl }) {
    const category = this.categoryFactory.createWith({
      name,
      imageUrl
    });

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
     * @param {string} imageUrl
     * @returns {Observable<null>}
     */
  update({ id, name, imageUrl }) {
    return RxLocalStorage.loadLocalStorage({ localStorageKey: this._localStorageKey })
            .catch(e => Rx.Observable.of([]))
            .map(categoryArray => {
              const optionalIndex = categoryArray.findIndex((category, index, array) => (category.id === id));
              if (optionalIndex !== -1) {
                categoryArray[optionalIndex].name = name;
                categoryArray[optionalIndex].imageUrl = imageUrl;
              } else {
                throw new Error('category not found');
              }
              return categoryArray;
            })
            .flatMap(categoryArray => RxLocalStorage.saveLocalStorage({ localStorageKey: this._localStorageKey, value: categoryArray }));
  }

}
