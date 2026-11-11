import path from 'path';
import {Container} from '../dic/Container';
import SqliteConnection from '../service/SqliteConnection';
import ImageStore from '../service/ImageStore';
import SettableClock from './SettableClock';
import FixturesService from './FixturesService';
import * as demoCatalog from './demoCatalog';
import * as demoOrders from './demoOrders';
import * as demoShop from './demoShop';
import * as demoSettings from './demoSettings';

/**
 * Plugin delivery for the seed: a stand-in for PluginHost that loads no plugin code,
 * so no plugin subscribes and nothing leaves the machine.
 */
const NO_PLUGIN_DELIVERY = Object.freeze({start() {}});

/**
 * The demo fixtures bootstrap. It is the app's container with three changes: the
 * database file it is given (photos go beside it), a clock the saga moves to each sale,
 * and plugin delivery replaced by a stand-in. The sale statistics subscriber is the
 * real one, so the seeded outbox rows end handled. The app never builds this.
 */
export default class FixturesContainer extends Container {

  /**
   * @param {{filename: string}} options
   */
  constructor({filename}) {
    super({environment: 'development'});
    this._filename = filename;
  }

  _sqliteConnection() {
    return new SqliteConnection({filename: this._filename});
  }

  _clock() {
    return new SettableClock();
  }

  _pluginHost() {
    return NO_PLUGIN_DELIVERY;
  }

  _productImageStore() {
    return new ImageStore({directory: this._beside('product-images')});
  }

  _categoryImageStore() {
    return new ImageStore({directory: this._beside('category-images')});
  }

  /**
   * The subscribers start as they do in the app: plugin delivery, then sale statistics.
   * @returns {import('./FixturesService').DemoSeed}
   */
  _demoSeed() {
    return {
      database: this.getInstance({key: 'sqliteConnection'}).database,
      transaction: this.getInstance({key: 'transaction'}),
      clock: this.getInstance({key: 'clock'}),
      startSubscribers: () => {
        this.getInstance({key: 'pluginHost'}).start();
        this.getInstance({key: 'recordProductSales'}).start();
      },
      eventDispatcher: this.getInstance({key: 'domainEventDispatcher'}),
      updateShopProfile: this.getInstance({key: 'updateShopProfile'}),
      updateSellPreferences: this.getInstance({key: 'updateSellPreferences'}),
      updatePrinterSettings: this.getInstance({key: 'updatePrinterSettings'}),
      updateLanguagePreferences: this.getInstance({key: 'updateLanguagePreferences'}),
      changeTheme: this.getInstance({key: 'changeTheme'}),
      changeLayout: this.getInstance({key: 'changeLayout'}),
      createCategory: this.getInstance({key: 'createCategory'}),
      listAllCategories: this.getInstance({key: 'listAllCategories'}),
      createProduct: this.getInstance({key: 'createProduct'}),
      addStock: this.getInstance({key: 'addStockProduct'}),
      disableProduct: this.getInstance({key: 'disableProduct'}),
      createOrder: this.getInstance({key: 'createOrderUseCase'})
    };
  }

  _fixturesService() {
    return new FixturesService({
      seed: this.getInstance({key: 'demoSeed'}),
      demoCatalog,
      demoOrders,
      demoShop,
      demoSettings
    });
  }

  /** Closes the database if it was opened. */
  close() {
    if (this._instances.has('sqliteConnection')) {
      this.getInstance({key: 'sqliteConnection'}).database.close();
    }
  }

  /**
   * @param {string} folder
   * @returns {string}
   */
  _beside(folder) {
    return path.join(path.dirname(this._filename), folder);
  }

}
