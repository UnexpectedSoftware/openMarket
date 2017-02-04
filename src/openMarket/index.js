import CategoryDependencyBuilder from './infrastructure/category/CategoryDependencyBuilder';
import ProductDependencyBuilder from './infrastructure/product/ProductDependencyBuilder';
import FixturesService from './infrastructure/service/FixturesService';

/**
 * @class OpenMarket
 */
class OpenMarket {

    /**
     * @constructs OpenMarket
     */
  constructor() {
        /**
         * @member OpenMarket#fixturesService
         * @type {FixturesService}
         */
    this.fixturesService = new FixturesService();
    this.fixturesService.load();
        /**
         *
         * @type {Map<string, UseCase>|Map}
         * @private
         */
    this.deps = new Map();
    this.deps.set('categories_list_all_use_case', CategoryDependencyBuilder.buildListAllCategories());
    this.deps.set('categories_find_by_id_use_case', CategoryDependencyBuilder.buildFindCategoryById());
    this.deps.set('categories_create_use_case', CategoryDependencyBuilder.buildCreateCategory());
    this.deps.set('categories_update_use_case', CategoryDependencyBuilder.buildUpdateCategory());
    this.deps.set('products_list_all_use_case', ProductDependencyBuilder.buildListAllProductsUseCase());
    this.deps.set('products_find_use_case', ProductDependencyBuilder.buildFindProductsUseCase());
    this.deps.set('products_create_or_update_use_case', ProductDependencyBuilder.buildCreateProduct());
    this.deps.set('products_add_stock_use_case', ProductDependencyBuilder.buildAddStockProduct());
  }

    /**
     *
     * @param {string} key
     * @returns {*}
     */
  get(key) {
    if (!this.deps.has(key)) {
      console.log(key);
      throw new Error(`Unsupported UseCase ${key}`);
    }
    return this.deps.get(key);
  }
}

export default new OpenMarket();
