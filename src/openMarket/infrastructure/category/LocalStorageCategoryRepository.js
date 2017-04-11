import CategoryRepository from '../../domain/category/CategoryRepository';
import RxLocalStorage from '../service/RxLocalStorage';
import { Observable } from 'rxjs/Observable';

const localStorageKey = 'categories';
/**
 * @class LocalStorageCategoryRepository
 * @implements {CategoryRepository}
 */
export default class LocalStorageCategoryRepository extends CategoryRepository {

    /**
     * @constructor
     * @param {CategoryFactory} categoryFactory
     */
  constructor({ categoryFactory }) {
    super();
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
    return RxLocalStorage.loadLocalStorage({ localStorageKey });
  }

    /**
     *
     * @param {string} id
     * @returns {Observable.<Category>}
     */
  findById({ id }) {
    return RxLocalStorage.loadLocalStorage({ localStorageKey })
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

    return RxLocalStorage.loadLocalStorage({ localStorageKey })
            .map(categoryArray => {
              categoryArray.push(category);
              return categoryArray;
            })
            .flatMap(categoryArray => RxLocalStorage.saveLocalStorage({ localStorageKey, value: categoryArray }));
  }

    /**
     *
     * @param {Array<Category>} data
     * @returns {Observable<null>}
     */
  saveCollection({ data }) {
    return RxLocalStorage.saveLocalStorage({ localStorageKey, value: data });
  }

    /**
     *
     * @param {string} id
     * @param {string} name
     * @param {string} imageUrl
     * @returns {Observable<null>}
     */
  update({ id, name, imageUrl }) {
    return RxLocalStorage.loadLocalStorage({ localStorageKey })
            .map(categoryArray => {
              const optionalIndex = categoryArray.findIndex((category, index, array) => (category.id == id));
              if (optionalIndex != -1) {
                categoryArray[optionalIndex].name = name;
                categoryArray[optionalIndex].imageUrl = imageUrl;
              } else {
                throw new Error('category not found');
              }
              return categoryArray;
            })
            .flatMap(categoryArray => RxLocalStorage.saveLocalStorage({ localStorageKey, value: categoryArray }));
  }

}
