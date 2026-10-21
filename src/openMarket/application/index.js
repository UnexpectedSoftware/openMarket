/**
 * @class OpenMarket
 */
import container from '../infrastructure/dic/Container';
import UnsupportedUseCaseError from '../domain/error/UnsupportedUseCaseError';
import {raise} from '../infrastructure/logging/ErrorLog';

/** @typedef {typeof container} AppContainer */

class OpenMarket {

    /**
     * @param {{container: AppContainer}} deps
     */
  constructor({container}) {
    this.fixturesService = container.getInstance({key:'fixturesService'});
    this.fixturesService.load();
        /**
         *
         * @type {Map<string, object>}
         * @private
         */
    this.deps = new Map();
    this.deps.set('categories_list_all_use_case',container.getInstance({key:'listAllCategories'}));
    this.deps.set('categories_find_by_id_use_case', container.getInstance({key:'findCategoryById'}));
    this.deps.set('categories_create_use_case', container.getInstance({key:'createCategory'}));
    this.deps.set('categories_update_use_case', container.getInstance({key:'updateCategory'}));
    this.deps.set('categories_delete_use_case', container.getInstance({key:'deleteCategory'}));
    this.deps.set('products_list_all_use_case', container.getInstance({key:'listAllProductsUseCase'}));
    this.deps.set('products_find_use_case', container.getInstance({key:'findProductsUseCase'}));
    this.deps.set('products_list_for_sale_query', container.getInstance({key:'productsQuery'}));
    this.deps.set('products_create_or_update_use_case', container.getInstance({key:'createProduct'}));
    this.deps.set('products_add_stock_use_case', container.getInstance({key:'addStockProduct'}));
    this.deps.set('products_disable_use_case', container.getInstance({key:'disableProduct'}));
    this.deps.set('products_enable_use_case', container.getInstance({key:'enableProduct'}));
    this.deps.set('products_statistics_use_case', container.getInstance({key:'productStatisticsUseCase'}));
    this.deps.set('product_sale_statistics_use_case', container.getInstance({key:'productSaleStatisticsUseCase'}));
    this.deps.set('orders_create_use_case', container.getInstance({key:'createOrderUseCase'}));
    this.deps.set('invoices_cancel_use_case', container.getInstance({key:'cancelInvoice'}));
    this.deps.set('domain_event_bus', container.getInstance({key:'domainEventBus'}));
    this.deps.set('orders_list_all_use_case', container.getInstance({key:'listAllOrdersUseCase'}));
    this.deps.set('orders_statistics_use_case', container.getInstance({key:'orderStatisticsUseCase'}));
    this.deps.set('images_fetch_use_case', container.getInstance({key:'fetchCatalogImages'}));
    this.deps.set('products_find_image_use_case', container.getInstance({key:'findProductImage'}));
    this.deps.set('products_print_catalog_use_case', container.getInstance({key:'printProductCatalog'}));
    this.deps.set('plugins_list_use_case', container.getInstance({key:'listPlugins'}));
    this.deps.set('plugins_save_use_case', container.getInstance({key:'savePlugin'}));
    this.deps.set('receipts_build_use_case', container.getInstance({key:'buildReceipt'}));
    this.deps.set('receipts_print_use_case', container.getInstance({key:'printReceipt'}));
    this.deps.set('shop_get_profile_use_case', container.getInstance({key:'getShopProfile'}));
    this.deps.set('shop_update_profile_use_case', container.getInstance({key:'updateShopProfile'}));
    this.deps.set('sell_get_preferences_use_case', container.getInstance({key:'getSellPreferences'}));
    this.deps.set('sell_update_preferences_use_case', container.getInstance({key:'updateSellPreferences'}));
    this.deps.set('appearance_get_use_case', container.getInstance({key:'getAppearancePreferences'}));
    this.deps.set('appearance_change_theme_use_case', container.getInstance({key:'changeTheme'}));
    container.getInstance({key:'pluginHost'}).start();
    container.getInstance({key:'recordProductSales'}).start();
    container.getInstance({key:'domainEventDispatcher'}).start();
  }

    /**
     *
     * @param {string} key
     * @returns {object}
     */
  get(key) {
    if (!this.deps.has(key)) {
      raise(new UnsupportedUseCaseError({key}));
    }
    return this.deps.get(key);
  }
}

export default new OpenMarket({container:container});
