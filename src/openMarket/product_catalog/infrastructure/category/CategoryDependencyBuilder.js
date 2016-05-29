import ListAllCategories from '../../application/service/category/ListAllCategories';
import LocalStorageCategoryRepository from './LocalStorageCategoryRepository';
import CategoryFactoryImpl from './CategoryFactoryImpl';
import UUIDIdentity from '../service/UUIDIdentity';

export default class CategoryDependencyBuilder {
    
    static buildCategoryRepository(){
        return new LocalStorageCategoryRepository();
    }
    
    static buildListAllCategories(){
        return new ListAllCategories({repository: CategoryDependencyBuilder.buildCategoryRepository()});
    }

    static buildCategoryFactory(){
        // TODO Refactory this
        let identity = new UUIDIdentity();
        return new CategoryFactoryImpl({identity:identity});
    }


}
