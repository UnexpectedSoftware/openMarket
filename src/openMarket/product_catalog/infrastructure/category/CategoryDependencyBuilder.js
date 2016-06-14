import ListAllCategories from '../../application/service/category/ListAllCategories';
import CreateCategory from '../../application/service/category/CreateCategory';
import UpdateCategory from '../../application/service/category/UpdateCategory';
import LocalStorageCategoryRepository from './LocalStorageCategoryRepository';
import CategoryFactoryImpl from './CategoryFactoryImpl';
import UUIDIdentity from '../service/UUIDIdentity';

export default class CategoryDependencyBuilder {
    
    static buildCategoryRepository(){
        return new LocalStorageCategoryRepository({categoryFactory : CategoryDependencyBuilder.buildCategoryFactory()});
    }
    
    static buildListAllCategories(){
        return new ListAllCategories({repository: CategoryDependencyBuilder.buildCategoryRepository()});
    }

    static buildCategoryFactory(){
        // TODO Refactory this
        let identity = new UUIDIdentity();
        return new CategoryFactoryImpl({identity:identity});
    }


    static buildCreateCategory() {
        return new CreateCategory({repository: CategoryDependencyBuilder.buildCategoryRepository()});
    }

    static buildUpdateCategory() {
        return new UpdateCategory({repository: CategoryDependencyBuilder.buildCategoryRepository()});
    }
}
