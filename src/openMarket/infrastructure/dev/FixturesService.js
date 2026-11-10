/**
 * @class FixturesService
 */
import {createFixtureInserter, clearShopData, runSeedTransaction} from '../service/sqliteSeed';
import {installInvoiceGuards} from '../service/SqliteConnection';
import {installDemoImages} from './demoImages';

export default class FixturesService {

  constructor({
    database = null,
    demoCatalog = null,
    demoOrders = null,
    demoShop = null,
    demoSettings = null,
    resetOnLoad = false,
    imageDirectory = null
  } = {}) {
    this._database = database;
    this._demoCatalog = demoCatalog;
    this._demoOrders = demoOrders;
    this._demoShop = demoShop;
    this._demoSettings = demoSettings;
    this._resetOnLoad = resetOnLoad === true;
    this._imageDirectory = imageDirectory;
  }

  /**
   * Seeds only when this process was started with a one-shot reset.
   * An empty database stays empty.
   */
  load() {
    if (!this._resetOnLoad) {
      return;
    }
    this.reset();
  }

  /**
   * Clears the shop tables and writes the demo set in one transaction.
   * @param {{now?: Date}} [options]
   */
  reset({now = new Date()} = {}) {
    if (process.env.NODE_ENV !== 'development' || !this._database || !this._ready()) {
      return;
    }
    const profile = this._demoShop.buildProfile();
    const settings = this._demoSettings.buildSettings();
    const categories = this._demoCatalog.buildCategories();
    const products = this._demoCatalog.buildProducts(categories);
    const orders = this._demoOrders.buildDemoOrders(products, now);
    this._write({profile, settings, categories, products, orders});
    if (this._imageDirectory) {
      installDemoImages({directory: this._imageDirectory, products});
    }
  }

  _ready() {
    return Boolean(this._demoCatalog && this._demoOrders && this._demoShop && this._demoSettings);
  }

  /**
   * @param {{profile: object, settings: object[], categories: object[], products: object[], orders: object[]}} seed
   */
  _write(seed) {
    const inserter = createFixtureInserter(this._database);
    runSeedTransaction(this._database, () => {
      clearShopData(this._database);
      inserter.insertProfile(seed.profile);
      seed.settings.forEach(setting => inserter.insertSetting(setting));
      seed.categories.forEach(category => inserter.insertCategory(category));
      seed.products.forEach(product => inserter.insertProduct(product));
      seed.orders.forEach(order => inserter.insertOrder(order));
      installInvoiceGuards(this._database);
    });
  }

}
