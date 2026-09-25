/**
 * @class FixturesService
 */
import { createFixtureInserter } from './sqliteSeed';

export default class FixturesService {

  constructor({database = null, demoCatalog = null, demoOrders = null} = {}) {
    this._database = database;
    this._demoCatalog = demoCatalog;
    this._demoOrders = demoOrders;
  }

  load() {
    if (process.env.NODE_ENV !== 'development' || !this._database || !this._demoCatalog || !this._demoOrders) {
      return;
    }
    const count = Number(this._database.prepare('SELECT count(*) AS total FROM category').get().total);
    if (count > 0) {
      return;
    }

    this._inserter = createFixtureInserter(this._database);
    this._database.exec('BEGIN');
    try {
      this.loadCategories();
      this.loadProducts();
      this.loadOrders();
      this._database.exec('COMMIT');
    } catch (error) {
      try {
        this._database.exec('ROLLBACK');
      } catch (rollbackError) {
        // A failed statement can already have ended the transaction.
      }
      throw error;
    }
  }

  loadCategories() {
    this._categories = this._demoCatalog.buildCategories();
    this._categories.forEach(category => this._inserter.insertCategory(category));
  }

  loadProducts() {
    this._products = this._demoCatalog.buildProducts(this._categories);
    this._products.forEach(product => this._inserter.insertProduct(product));
  }

  loadOrders() {
    this._demoOrders.buildDemoOrders(this._products).forEach(order => this._inserter.insertOrder(order));
  }

}
