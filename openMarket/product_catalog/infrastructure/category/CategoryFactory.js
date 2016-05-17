import ListAllCategories from '../../application/service/category/ListAllCategories';
import LocalStorageCategoryRepository from '../../infrastructure/category/LocalStorageCategoryRepository';
export default class CategoryFactory {
    
    static buildCategoryRepository(){
        return new LocalStorageCategoryRepository();
    }
    
    static buildListAllCategories(){
        return new ListAllCategories({repository:CategoryFactory.buildCategoryRepository()});
    }
}
