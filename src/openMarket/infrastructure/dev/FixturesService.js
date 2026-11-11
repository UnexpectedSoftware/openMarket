/**
 * @class FixturesService
 */
import os from 'os';
import fs from 'fs';
import path from 'path';
import Quantity from '../../domain/money/Quantity';
import ProductStatus from '../../domain/product/ProductStatus';
import {clearShopData} from '../service/sqliteSeed';
import {writeDemoImages} from './demoImages';
import runNow from '../service/runNow';
/** @typedef {import('./demoCatalog').DemoProduct} DemoProduct */
/** @typedef {import('./demoOrders').DemoTicket} DemoTicket */
/** @typedef {import('../service/SettableClock').default} SettableClock */
/** @typedef {import('../event/SeedableDomainEventSubscribers').default} SeedableDomainEventSubscribers */

/**
 * What the seed saga drives: the use cases the screens call, on the app's one event bus.
 * While it runs, `subscribers` is bootstrapped with `seedSubscribers`: the shop's own
 * durable handlers it keeps (sale statistics) run for real, and plugin delivery,
 * printing, and live listeners are replaced by stand-ins that do nothing.
 * @typedef {object} DemoSeed
 * @property {{execute: (work: () => *) => *}} transaction
 * @property {SettableClock} clock
 * @property {SeedableDomainEventSubscribers} subscribers
 * @property {{keep: string[]}} seedSubscribers
 * @property {{dispatch: () => void}} eventDispatcher
 * @property {{start: () => void}} recordProductSales
 * @property {{update: Function}} updateShopProfile
 * @property {{update: Function}} updateSellPreferences
 * @property {{update: Function}} updatePrinterSettings
 * @property {{update: Function}} updateLanguagePreferences
 * @property {{changeTheme: Function}} changeTheme
 * @property {{changeLayout: Function}} changeLayout
 * @property {{createCategory: Function}} createCategory
 * @property {{findAllWithStats: Function}} listAllCategories
 * @property {{createOrUpdate: Function}} createProduct
 * @property {{addStock: Function}} addStock
 * @property {{disable: Function}} disableProduct
 * @property {{createOrder: Function}} createOrder
 */

export default class FixturesService {

  /**
   * @param {object} [deps]
   * @param {{exec: Function} | null} [deps.database]
   * @param {(() => DemoSeed) | null} [deps.seed] Built on the first reset, so a normal start pays nothing.
   * @param {*} [deps.demoCatalog]
   * @param {*} [deps.demoOrders]
   * @param {*} [deps.demoShop]
   * @param {*} [deps.demoSettings]
   * @param {boolean} [deps.resetOnLoad]
   */
  constructor({
    database = null,
    seed = null,
    demoCatalog = null,
    demoOrders = null,
    demoShop = null,
    demoSettings = null,
    resetOnLoad = false
  } = {}) {
    this._database = database;
    this._seedFactory = seed;
    this._seed = null;
    this._demoCatalog = demoCatalog;
    this._demoOrders = demoOrders;
    this._demoShop = demoShop;
    this._demoSettings = demoSettings;
    this._resetOnLoad = resetOnLoad === true;
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
   * Clears the shop and replays the demo through the use cases, oldest sale first, in one
   * transaction: a failure rolls every step back. After the commit the normal dispatcher
   * delivers the stored events to the seed's subscribers, so the sale statistics are
   * filled, and plugin deliveries are recorded as handled, before this returns.
   * @param {{now?: Date}} [options]
   */
  reset({now} = {}) {
    if (process.env.NODE_ENV !== 'development' || !this._database || !this._ready()) {
      return;
    }
    const seed = this._seedOnce();
    const plan = this._plan(now || new Date(seed.clock.now()));
    const imageDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'openmarket-demo-images-'));
    seed.subscribers.seedWith(seed.seedSubscribers);
    try {
      const images = writeDemoImages({directory: imageDirectory, products: plan.products});
      seed.transaction.execute(() => {
        clearShopData(this._database);
        runSaga(seed, plan, images);
      });
      seed.eventDispatcher.dispatch();
    } finally {
      seed.clock.resume();
      seed.subscribers.resume();
      fs.rmSync(imageDirectory, {recursive: true, force: true});
    }
  }

  _ready() {
    return Boolean(this._seedFactory && this._demoCatalog && this._demoOrders && this._demoShop && this._demoSettings);
  }

  /**
   * @returns {DemoSeed}
   */
  _seedOnce() {
    if (!this._seed) {
      this._seed = this._seedFactory();
      this._seed.recordProductSales.start();
    }
    return this._seed;
  }

  /**
   * @param {Date} now
   */
  _plan(now) {
    const products = this._demoCatalog.buildProducts();
    const tickets = this._demoOrders.buildDemoOrders(products, now);
    return {
      profile: this._demoShop.buildProfile(),
      settings: this._demoSettings.buildSettings(),
      categories: this._demoCatalog.buildCategories(),
      products,
      tickets,
      sold: this._demoOrders.soldQuantities(tickets)
    };
  }

}

/**
 * Shop and settings, categories, products, opening stock, then every sale at its own time.
 * @param {DemoSeed} seed
 * @param {{profile: object, settings: *, categories: Array<{name: string}>, products: DemoProduct[], tickets: DemoTicket[], sold: Map<string, Quantity>}} plan
 * @param {Map<string, string>} images
 */
function runSaga(seed, plan, images) {
  runNow(seed.updateShopProfile.update(plan.profile));
  runNow(seed.updateSellPreferences.update(plan.settings.sell));
  runNow(seed.updatePrinterSettings.update(plan.settings.printer));
  runNow(seed.updateLanguagePreferences.update(plan.settings.language));
  runNow(seed.changeTheme.changeTheme({theme: plan.settings.appearance.theme}));
  runNow(seed.changeLayout.changeLayout({layout: plan.settings.appearance.layout}));
  plan.categories.forEach(category => runNow(seed.createCategory.createCategory({name: category.name})));
  const categoryIds = new Map(runNow(seed.listAllCategories.findAllWithStats())
    .map(category => [category.name, category.id]));
  plan.products.forEach(product => runNow(seed.createProduct.createOrUpdate(productCommand(product, categoryIds, images))));
  plan.products.forEach(product => runNow(seed.addStock.addStock({
    barcode: product.barcode,
    quantity: openingStock(product, plan.sold.get(product.barcode))
  })));
  plan.products.filter(product => !product.enabled)
    .forEach(product => runNow(seed.disableProduct.disable({barcode: product.barcode})));
  plan.tickets.forEach(ticket => {
    seed.clock.moveTo(ticket.at);
    runNow(seed.createOrder.createOrder({lines: ticket.lines, payment: ticket.payment}));
  });
}

/**
 * Enough stock for every demo sale, so the product ends on its closing stock.
 * @param {DemoProduct} product
 * @param {Quantity | undefined} sold
 * @returns {number}
 */
function openingStock(product, sold) {
  return Quantity.ofMilli(product.closingStock * 1000 + (sold ? sold.milli : 0)).units;
}

/**
 * @param {DemoProduct} product
 * @param {Map<string, string>} categoryIds
 * @param {Map<string, string>} images
 */
function productCommand(product, categoryIds, images) {
  return {
    barcode: product.barcode,
    name: product.name,
    description: product.description,
    price: product.price,
    basePrice: product.basePrice,
    stock: 0,
    stockMin: product.stockMin,
    weighted: product.weighted,
    categoryId: categoryIds.get(product.categoryName),
    status: ProductStatus.ENABLED,
    vatRate: product.vatRate,
    imagePath: images.get(product.barcode) || null
  };
}
