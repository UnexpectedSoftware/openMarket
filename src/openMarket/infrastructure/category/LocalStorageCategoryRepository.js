import CategoryRepository from "../../domain/category/CategoryRepository";
import RxLocalStorage from "../service/RxLocalStorage";
import Rx from 'rx';

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
    constructor({categoryFactory}){
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
    findAll(){
        return RxLocalStorage.loadLocalStorage({localStorageKey: localStorageKey});
    }

    /**
     *
     * @param {string} id
     * @returns {Observable.<Category>}
     */
    findById({id}){
        return RxLocalStorage.loadLocalStorage({localStorageKey: localStorageKey})
            .flatMap(arrayData => Rx.Observable.from(arrayData))
            .filter(category => category.id === id)
            ;
    }


    /**
     *
     * @param name
     * @param imageUrl
     * @returns {Observable<null>}
     */
    save({name,imageUrl}){
        let category = this.categoryFactory.createWith({
            name: name,
            imageUrl: imageUrl
        });

        return RxLocalStorage.loadLocalStorage({localStorageKey: localStorageKey})
            .map(categoryArray => {
                categoryArray.push(category);
                return categoryArray;
            })
            .flatMap(categoryArray => RxLocalStorage.saveLocalStorage({localStorageKey: localStorageKey, value:categoryArray}));


    }

    /**
     *
     * @param {Array<Category>} data
     * @returns {Observable<null>}
     */
    saveCollection({data}){
        return RxLocalStorage.saveLocalStorage({localStorageKey: localStorageKey, value:data});
    }

    /**
     *
     * @param {string} id
     * @param {string} name
     * @param {string} imageUrl
     * @returns {Observable<null>}
     */
    update({id,name,imageUrl}){
        return RxLocalStorage.loadLocalStorage({localStorageKey: localStorageKey})
            .map(categoryArray => {
                let optionalIndex = categoryArray.findIndex((category,index,array) =>{
                    return (category.id == id);
                });
                if(optionalIndex != -1) {
                    categoryArray[optionalIndex].name = name;
                    categoryArray[optionalIndex].imageUrl = imageUrl;
                }else{
                     throw new Error("category not found");
                }
                return categoryArray;
            })
            .flatMap(categoryArray => RxLocalStorage.saveLocalStorage({localStorageKey: localStorageKey, value:categoryArray}));
    }

}
