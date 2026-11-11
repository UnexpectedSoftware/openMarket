/**
 * @class FixturesService
 */
import os from 'os';
import fs from 'fs';
import path from 'path';
import Quantity from '../../domain/money/Quantity';
import ProductStatus from '../../domain/product/ProductStatus';
import {clearShopData} from './clearShopData';
import {writeDemoImages} from './demoImages';
import runNow from '../service/runNow';
/** @typedef {import('./demoCatalog').DemoProduct} DemoProduct */
/** @typedef {import('./demoOrders').DemoTicket} DemoTicket */
/** @typedef {import('./SettableClock').default} SettableClock */

/**
 * What the seed saga drives: the use cases the screens call, wired by the fixtures
 * container on its own bus. `startSubscribers` registers the subscribers that bootstrap
 * chose (the real sale statistics; plugin delivery as a stand-in that loads nothing).
 * @typedef {object} DemoSeed
 * @property {{exec: Function}} database
 * @property {{execute: (work: () => *) => *}} transaction
 * @property {SettableClock} clock
 * @property {() => void} startSubscribers
 * @property {{dispatch: () => void}} eventDispatcher
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

/**
 * @typedef {object} SeedSummary
 * @property {number} categories
 * @property {number} products
 * @property {number} orders
 * @property {string} from first sale, ISO
 * @property {string} to last sale, ISO
 */

/**
 * Replaces the shop in a database with the demo shop. Only the fixtures script runs it.
 */
export default class FixturesService {

  /**
   * @param {object} deps
   * @param {DemoSeed} deps.seed
   * @param {*} deps.demoCatalog
   * @param {*} deps.demoOrders
   * @param {*} deps.demoShop
   * @param {*} deps.demoSettings
   */
  constructor({seed, demoCatalog, demoOrders, demoShop, demoSettings}) {
    this._seed = seed;
    this._demoCatalog = demoCatalog;
    this._demoOrders = demoOrders;
    this._demoShop = demoShop;
    this._demoSettings = demoSettings;
  }

  /**
   * Clears the shop and replays the demo through the use cases, oldest sale first, in one
   * transaction: a failure rolls every step back. The shop opens at the first sale's time,
   * when the subscribers register. After the commit the dispatcher delivers the stored
   * events, so the sale statistics are filled before this returns.
   * @param {{now: Date}} options
   * @returns {SeedSummary}
   */
  reset({now}) {
    const seed = this._seed;
    const plan = this._plan(now);
    const imageDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'openmarket-demo-images-'));
    try {
      const images = writeDemoImages({directory: imageDirectory, products: plan.products});
      seed.transaction.execute(() => {
        clearShopData(seed.database);
        seed.clock.moveTo(plan.tickets[0].at);
        seed.startSubscribers();
        runSaga(seed, plan, images);
      });
      seed.eventDispatcher.dispatch();
    } finally {
      seed.clock.resume();
      fs.rmSync(imageDirectory, {recursive: true, force: true});
    }
    return {
      categories: plan.categories.length,
      products: plan.products.length,
      orders: plan.tickets.length,
      from: plan.tickets[0].at.toISOString(),
      to: plan.tickets[plan.tickets.length - 1].at.toISOString()
    };
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
