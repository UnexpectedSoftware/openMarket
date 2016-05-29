import CategoryDependencyBuilder from './product_catalog/infrastructure/category/CategoryDependencyBuilder';
import ProductDependencyBuilder from './product_catalog/infrastructure/product/ProductDependencyBuilder';
import FixturesService from './product_catalog/infrastructure/service/FixturesService';

class OpenMarket {

    constructor() {

        this.fixturesService = new FixturesService();
        this.fixturesService.load();
        this._deps = new Map();
        this._deps.set('categories_list_all_use_case', CategoryDependencyBuilder.buildListAllCategories());
        this._deps.set('products_list_all_use_case', ProductDependencyBuilder.buildListAllProductsUseCase());
    }


    get(key) {
        if (!this._deps.has(key)) {
            throw new Error('Unsupported UseCase');
        }
        return this._deps.get(key);
    }
}

export default new OpenMarket();
