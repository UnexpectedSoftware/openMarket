import path from 'path';
import {Container} from '../dic/Container';
import SqliteConnection from '../service/SqliteConnection';
import RecordProductSales from '../../application/service/product/RecordProductSales';
import ImageStore from '../service/ImageStore';
import SettableClock from './SettableClock';
import FixturesService from './FixturesService';
import ProgressSaleStatistics from './ProgressSaleStatistics';
import SeedProgress from './seedProgress';
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
 * The demo fixtures bootstrap. It is the app's container with the database file it is
 * given (photos go beside it), a clock the saga moves to each sale, plugin delivery
 * replaced by a stand-in, and a progress bar that only this container subscribes.
 * The sale statistics subscriber is the real one, so the seeded outbox rows end handled.
 * The app never builds this.
 */
export default class FixturesContainer extends Container {

  /**
   * @param {{filename: string, out?: {write: Function, isTTY?: boolean}}} options
   */
  constructor({filename, out = process.stdout}) {
    super({environment: 'development'});
    this._filename = filename;
    this._out = out;
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

  /** @returns {SeedProgress} */
  _seedProgress() {
    return new SeedProgress({out: this._out});
  }

  /**
   * The real sale-statistics subscriber, counting each applied order for the informes bar.
   * @returns {RecordProductSales}
   */
  _recordProductSales() {
    return new RecordProductSales({
      repository: new ProgressSaleStatistics({
        repository: Container.prototype._productSaleStatisticsRepository.call(this),
        onApply: () => this.getInstance({key: 'seedProgress'}).reportApplied()
      }),
      domainEventBus: this.getInstance({key: 'domainEventBus'})
    });
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
      progress: this.getInstance({key: 'seedProgress'}),
      startSubscribers: () => {
        this.getInstance({key: 'seedProgress'}).attach(this.getInstance({key: 'domainEventBus'}));
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
