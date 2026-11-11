import {clearShopData} from '../../../openMarket/infrastructure/dev/clearShopData';
import runNow from '../../../openMarket/infrastructure/service/runNow';
/** @typedef {import('../../../openMarket/domain/category/Category').default} Category */
/** @typedef {import('../../../openMarket/domain/product/Product').default} Product */
/** @typedef {import('../../../openMarket/domain/order/Order').default} Order */

/**
 * Empties the shop and stores the given aggregates through the container's repositories,
 * in one transaction. Products must be built with Product.create and orders placed.
 * @param {{getInstance: Function}} container
 * @param {{categories?: Category[], products?: Product[], orders?: Order[]}} [shop]
 */
export default function seedShop(container, {categories = [], products = [], orders = []} = {}) {
  const repository = key => container.getInstance({key});
  repository('transaction').execute(() => {
    clearShopData(repository('sqliteConnection').database);
    categories.forEach(category => runNow(repository('categoryRepository').save({category})));
    products.forEach(product => runNow(repository('productRepository').save({product})));
    orders.forEach(order => runNow(repository('orderRepository').save({order})));
  });
}
