/**
 * @class FixturesService
 */
import RxLocalStorage from "../service/RxLocalStorage";
import {CATEGORIES_KEY, PRODUCTS_KEY, ORDERS_KEY} from "../service/LocalStorageKeys";
import categories from "../../../resources/fixtures/categories.json"
import products from "../../../resources/fixtures/products.json"
import orders from "../../../resources/fixtures/orders.json"
import { seedSqliteIfEmpty } from "./sqliteSeed";

export default class FixturesService {

  constructor({store = 'LocalStorage', database = null} = {}) {
    this._store = store;
    this._database = database;
  }

  load() {
    if (this._store === 'Sqlite') {
      if (process.env.NODE_ENV === 'development' && this._database) {
        seedSqliteIfEmpty(this._database, {categories, products, orders});
      }
      return;
    }
    this.loadCategories();
    this.loadProducts();
    this.loadOrders();
  }

  loadCategories(){
    RxLocalStorage.saveLocalStorage({localStorageKey: CATEGORIES_KEY, value:categories})
      .subscribe();
  }

  loadProducts(){
    RxLocalStorage.saveLocalStorage({localStorageKey: PRODUCTS_KEY, value:products})
      .subscribe();
  }

  loadOrders() {
    RxLocalStorage.saveLocalStorage({localStorageKey: ORDERS_KEY, value:orders})
      .subscribe();
  }

}
