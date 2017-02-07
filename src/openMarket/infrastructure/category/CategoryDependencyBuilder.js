import ListAllCategories from '../../application/service/category/ListAllCategories';
import FindCategoryById from '../../application/service/category/FindCategoryById';
import CreateCategory from '../../application/service/category/CreateCategory';
import UpdateCategory from '../../application/service/category/UpdateCategory';
import LocalStorageCategoryRepository from './LocalStorageCategoryRepository';
import CategoryFactoryImpl from './CategoryFactoryImpl';
import UUIDIdentity from '../service/UUIDIdentity';
/**
 * @class CategoryDependencyBuilder
 */
export default class CategoryDependencyBuilder {

    /**
     *
     * @returns {LocalStorageCategoryRepository}
     */
  static buildCategoryRepository() {
    return new LocalStorageCategoryRepository({ categoryFactory: CategoryDependencyBuilder.buildCategoryFactory() });
  }

    /**
     *
     * @returns {ListAllCategories}
     */
  static buildListAllCategories() {
    return new ListAllCategories({ repository: CategoryDependencyBuilder.buildCategoryRepository() });
  }

    /**
     *
      * @returns {FindCategoryById}
     */
  static buildFindCategoryById() {
    return new FindCategoryById({ repository: CategoryDependencyBuilder.buildCategoryRepository() });
  }

    /**
     *
     * @returns {CategoryFactoryImpl}
     */
  static buildCategoryFactory() {
        // TODO Refactory this
    const identity = new UUIDIdentity();
    return new CategoryFactoryImpl({ identity });
  }

    /**
     *
     * @returns {CreateCategory}
     */
  static buildCreateCategory() {
    return new CreateCategory({ repository: CategoryDependencyBuilder.buildCategoryRepository() });
  }

    /**
     *
     * @returns {UpdateCategory}
     */
  static buildUpdateCategory() {
    return new UpdateCategory({ repository: CategoryDependencyBuilder.buildCategoryRepository() });
  }
}