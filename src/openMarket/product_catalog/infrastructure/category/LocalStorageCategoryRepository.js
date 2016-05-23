import CategoryRepository from '../../domain/category/CategoryRepository';
import Rx from 'rx';
import RxLocalStorage from '../service/RxLocalStorage';

const localStorageKey = 'categories';

export default class LocalStorageCategoryRepository extends CategoryRepository {

    constructor(){
        super();
    }

    findAll(){
        return RxLocalStorage.loadLocalStorage({localStorageKey: localStorageKey});
    }

    save({category}){
        return RxLocalStorage.saveLocalStorage({localStorageKey: localStorageKey, value:category});
    }

}
