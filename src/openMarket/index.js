import CategoryFactory from './product_catalog/infrastructure/category/CategoryFactory';

class OpenMarket {

    constructor(){

        this._deps = new Map();
        this._deps.set('categories_list_all_use_case', CategoryFactory.buildListAllCategories());
    }


    get(key) {
        if (!this._deps.has(key)) {
            throw new Error('Unsupported UseCase');
        }
        return this._deps.get(key);
    }


}

export default new OpenMarket();
