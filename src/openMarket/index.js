import CategoryDependencyBuilder from './product_catalog/infrastructure/category/CategoryDependencyBuilder';
import ProductDependencyBuilder from './product_catalog/infrastructure/product/ProductDependencyBuilder';
import FixturesService from './product_catalog/infrastructure/service/FixturesService';

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
         * @type {Map<K, V>|Map}
         * @private
         */
        this._deps = new Map();
        this._deps.set('categories_list_all_use_case', CategoryDependencyBuilder.buildListAllCategories());
        this._deps.set('categories_find_by_id_use_case', CategoryDependencyBuilder.buildFindCategoryById());
        this._deps.set('categories_create_use_case', CategoryDependencyBuilder.buildCreateCategory());
        this._deps.set('categories_update_use_case', CategoryDependencyBuilder.buildUpdateCategory());
        this._deps.set('products_list_all_use_case', ProductDependencyBuilder.buildListAllProductsUseCase());
    }

    /**
     *
     * @param {string} key
     * @returns {V}
     */
    get(key) {
        if (!this._deps.has(key)) {
            throw new Error('Unsupported UseCase');
        }
        return this._deps.get(key);
    }
}

export default new OpenMarket();
