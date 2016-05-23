import CategoryRepository from '../../domain/category/CategoryRepository';
import Rx from 'rx';
import RxLocalStorage from '../../service/RxLocalStorage';

const localStorageKey = 'categories';

export default class LocalStorageCategoryRepository extends CategoryRepository {

    constructor(){
        super();
    }

    findAllCategories({filters}){
        return RxLocalStorage.loadLocalStorage({localStorageKey})
            .flatMap( categories => Rx.Observable.from(categories))
        ;
    }
    
    
    
    


}
