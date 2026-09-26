/**
 * @class OpenMarket
 */
import container from '../infrastructure/dic/Container';
class OpenMarket {

    /**
     * @constructs OpenMarket
     */
  constructor({container}) {
    this.fixturesService = container.getInstance({key:'fixturesService'});
    this.fixturesService.load();
        /**
         *
         * @type {Map<string, UseCase>|Map}
         * @private
         */
    this.deps = new Map();
    this.deps.set('categories_list_all_use_case',container.getInstance({key:'listAllCategories'}));
    this.deps.set('categories_find_by_id_use_case', container.getInstance({key:'findCategoryById'}));
    this.deps.set('categories_create_use_case', container.getInstance({key:'createCategory'}));
    this.deps.set('categories_update_use_case', container.getInstance({key:'updateCategory'}));
    this.deps.set('products_list_all_use_case', container.getInstance({key:'listAllProductsUseCase'}));
    this.deps.set('products_find_use_case', container.getInstance({key:'findProductsUseCase'}));
    this.deps.set('products_create_or_update_use_case', container.getInstance({key:'createProduct'}));
    this.deps.set('products_add_stock_use_case', container.getInstance({key:'addStockProduct'}));
    this.deps.set('products_statistics_use_case', container.getInstance({key:'productStatisticsUseCase'}));
    this.deps.set('orders_create_use_case', container.getInstance({key:'createOrderUseCase'}));
    this.deps.set('orders_list_all_use_case', container.getInstance({key:'listAllOrdersUseCase'}));
    this.deps.set('orders_statistics_use_case', container.getInstance({key:'orderStatisticsUseCase'}));
    this.deps.set('images_fetch_use_case', container.getInstance({key:'fetchCatalogImages'}));
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

export default new OpenMarket({container:container});
