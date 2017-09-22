/**
 * @class OpenMarket
 */
import FixturesService from '../infrastructure/service/FixturesService';
import container from '../infrastructure/dic/Container';
class OpenMarket {

    /**
     * @constructs OpenMarket
     */
  constructor({container}) {
        /**
         * @member OpenMarket#fixturesService
         * @type {FixturesService}
         */
    this.fixturesService = container.fixturesService();
    this.fixturesService.load();
        /**
         *
         * @type {Map<string, UseCase>|Map}
         * @private
         */
    this.deps = new Map();
    this.deps.set('categories_list_all_use_case',container.listAllCategories());
    this.deps.set('categories_find_by_id_use_case', container.findCategoryById());
    this.deps.set('categories_create_use_case', container.createCategory());
    this.deps.set('categories_update_use_case', container.updateCategory());
    this.deps.set('products_list_all_use_case', container.listAllProductsUseCase());
    this.deps.set('products_find_use_case', container.findProductsUseCase());
    this.deps.set('products_create_or_update_use_case', container.createProduct());
    this.deps.set('products_add_stock_use_case', container.addStockProduct());
    this.deps.set('products_statistics_use_case', container.productStatisticsUseCase());
    this.deps.set('orders_create_use_case', container.createOrderUseCase());
    this.deps.set('orders_list_all_use_case', container.listAllOrdersUseCase());
    this.deps.set('orders_statistics_use_case', container.orderStatisticsUseCase());
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
