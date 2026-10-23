const fs = require('fs');
const path = require('path');

let loaded = false;

function openConnection(userData) {
  const classes = appClasses();
  return {
    classes,
    connection: new classes.SqliteConnection({
      filename: path.join(userData, 'openmarket.sqlite')
    })
  };
}

function rollback(database) {
  try {
    database.exec('ROLLBACK');
  } catch (rollbackError) {
    // A failed statement can already have ended the transaction.
  }
}

function listed(value) {
  return value || [];
}

function themeIfSet(repos, theme) {
  if (!theme) {
    return Promise.resolve();
  }
  return applyTheme(repos, theme);
}

async function insertShop(opened, userData, shop) {
  const repos = repositories(opened.classes, opened.connection, userData);
  const categories = await seedCategories(repos, userData, listed(shop.categories));
  await seedProducts(repos, categories, listed(shop.products));
  await seedOrders(repos, listed(shop.orders));
  await themeIfSet(repos, shop.theme);
}

async function writeShop(opened, userData, shop) {
  const database = opened.connection.database;
  database.exec('BEGIN');
  try {
    await insertShop(opened, userData, shop);
    database.exec('COMMIT');
  } catch (error) {
    rollback(database);
    throw error;
  }
}

/**
 * Writes categories, products, orders, and the theme into the test
 * user-data database before Electron starts. The rows go through the
 * same use cases and repositories the till uses.
 * @param {string} userData
 * @param {{
 *   categories?: Array<string | {name: string, image?: boolean, imagePath?: string | null}>,
 *   products?: Array<{
 *     name: string,
 *     barcode: string,
 *     price: number | string,
 *     basePrice: number | string,
 *     stock: number,
 *     stockMin: number,
 *     category: string,
 *     vat?: string | null,
 *     weighted?: boolean,
 *     description?: string,
 *     status?: string
 *   }>,
 *   orders?: Array<{
 *     lines: Array<{barcode: string, name: string, price: number | string, quantity?: number | string, vat?: string | null}>,
 *     payment?: {method: string, tendered: *} | null,
 *     secondsAgo?: number
 *   }>,
 *   theme?: string
 * }} shop
 * @returns {Promise<void>}
 */
async function seedShop(userData, shop = {}) {
  fs.mkdirSync(userData, {recursive: true});
  const opened = openConnection(userData);
  try {
    await writeShop(opened, userData, shop || {});
  } finally {
    opened.connection.database.close();
  }
}

/**
 * Stores one theme in an existing or new test database.
 * @param {string} userData
 * @param {string} theme
 * @returns {Promise<void>}
 */
function seedTheme(userData, theme) {
  return seedShop(userData, {theme});
}

function appClasses() {
  if (!loaded) {
    require('@babel/register');
    require('rxjs');
    loaded = true;
  }
  return {
    SqliteConnection: load('../src/openMarket/infrastructure/service/SqliteConnection'),
    ImageStore: load('../src/openMarket/infrastructure/service/ImageStore'),
    RandomUUIDIdentity: load('../src/openMarket/domain/RandomUUIDIdentity'),
    CategoryFactoryImpl: load('../src/openMarket/infrastructure/category/CategoryFactoryImpl'),
    SqliteCategoryQueryService: load('../src/openMarket/infrastructure/category/SqliteCategoryQueryService'),
    SqliteCategoryRepository: load('../src/openMarket/infrastructure/category/SqliteCategoryRepository'),
    CreateCategory: load('../src/openMarket/application/service/category/CreateCategory'),
    ProductFactoryImpl: load('../src/openMarket/infrastructure/product/ProductFactoryImpl'),
    SqlProductMapper: load('../src/openMarket/infrastructure/product/SqlProductMapper'),
    SqliteProductQueryService: load('../src/openMarket/infrastructure/product/SqliteProductQueryService'),
    SqliteProductRepository: load('../src/openMarket/infrastructure/product/SqliteProductRepository'),
    CreateOrUpdateProduct: load('../src/openMarket/application/service/product/CreateOrUpdateProduct'),
    SystemClock: load('../src/openMarket/infrastructure/service/SystemClock'),
    OrderFactoryImpl: load('../src/openMarket/infrastructure/order/OrderFactoryImpl'),
    SqlOrderMapper: load('../src/openMarket/infrastructure/order/SqlOrderMapper'),
    SqliteOrderQueryService: load('../src/openMarket/infrastructure/order/SqliteOrderQueryService'),
    SqliteOrderRepository: load('../src/openMarket/infrastructure/order/SqliteOrderRepository'),
    SqliteAppearancePreferencesRepository: load('../src/openMarket/infrastructure/appearance/SqliteAppearancePreferencesRepository'),
    ChangeTheme: load('../src/openMarket/application/service/appearance/ChangeTheme')
  };
}

function load(modulePath) {
  const imported = require(modulePath);
  if (imported && imported.__esModule && imported.default) {
    return imported.default;
  }
  return imported;
}

function repositories(classes, connection, userData) {
  const identity = new classes.RandomUUIDIdentity();
  const categoryFactory = new classes.CategoryFactoryImpl({identity});
  const categoryRepository = new classes.SqliteCategoryRepository({
    connection,
    categoryFactory,
    images: new classes.ImageStore({directory: path.join(userData, 'category-images')}),
    queryService: new classes.SqliteCategoryQueryService()
  });
  const productFactory = new classes.ProductFactoryImpl({identity});
  const productRepository = new classes.SqliteProductRepository({
    connection,
    productMapper: new classes.SqlProductMapper({productFactory, categoryFactory}),
    images: new classes.ImageStore({directory: path.join(userData, 'product-images')}),
    queryService: new classes.SqliteProductQueryService()
  });
  return {
    categoryRepository,
    createCategory: new classes.CreateCategory({
      repository: categoryRepository,
      categoryFactory
    }),
    createProduct: new classes.CreateOrUpdateProduct({
      productRepository,
      productFactory,
      categoryRepository
    }),
    orderFactory: new classes.OrderFactoryImpl({
      identity,
      clock: new classes.SystemClock()
    }),
    orderRepository: new classes.SqliteOrderRepository({
      connection,
      objectMapper: new classes.SqlOrderMapper(),
      queryService: new classes.SqliteOrderQueryService()
    }),
    changeTheme: new classes.ChangeTheme({
      appearancePreferencesRepository: new classes.SqliteAppearancePreferencesRepository({connection})
    })
  };
}

async function seedCategories(repos, userData, categories) {
  for (const category of categories) {
    const spec = normalizeCategory(userData, category);
    await done(repos.createCategory.createCategory({
      name: spec.name,
      imagePath: spec.imagePath
    }));
  }
  const ids = new Map();
  if (categories.length === 0) {
    return ids;
  }
  const saved = await done(repos.categoryRepository.findAll());
  saved.forEach(category => ids.set(category.name, category.id));
  return ids;
}

function normalizeCategory(userData, category) {
  if (typeof category === 'string') {
    return {name: category, imagePath: null};
  }
  const imagePath = category.image
    ? path.join(userData, 'pixel.png')
    : (category.imagePath || null);
  return {name: category.name, imagePath};
}

function productCommand(product, categoryId) {
  return {
    barcode: product.barcode,
    name: product.name,
    description: product.description || '',
    price: product.price,
    basePrice: product.basePrice,
    stock: product.stock,
    stockMin: product.stockMin,
    weighted: Boolean(product.weighted),
    categoryId,
    status: product.status,
    vatRate: product.vat || null
  };
}

async function seedProducts(repos, categories, products) {
  for (const product of products) {
    const categoryId = categories.get(product.category);
    if (!categoryId) {
      throw new Error(`Seeded product ${product.name} needs category ${product.category}`);
    }
    await done(repos.createProduct.createOrUpdate(productCommand(product, categoryId)));
  }
}

function orderLine(line) {
  return {
    barcode: line.barcode,
    name: line.name,
    price: line.price,
    quantity: line.quantity == null ? 1 : line.quantity,
    vatRate: line.vat
  };
}

function paymentOrExact(spec, order) {
  if (spec.payment === undefined) {
    return {method: 'cash', tendered: order.total};
  }
  return spec.payment;
}

function shopStamp(secondsAgo) {
  const instant = new Date(Date.now() - secondsAgo * 1000).toISOString();
  const local = new (appClasses().SystemClock)().zoned({instant}).local;
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})/.exec(local);
  return match[3] + '/' + match[2] + '/' + match[1] + ' ' + match[4] + ':' + match[5] + ':' + match[6];
}

function orderDate(spec) {
  if (spec.secondsAgo == null) {
    return undefined;
  }
  return shopStamp(spec.secondsAgo);
}

async function saveSeededOrder(repos, spec) {
  const order = repos.orderFactory.createWith({date: orderDate(spec)});
  (spec.lines || []).forEach(line => order.addLine(orderLine(line)));
  order.place();
  const payment = paymentOrExact(spec, order);
  if (payment) {
    order.recordPayment(payment);
  }
  await done(repos.orderRepository.save({order}));
}

async function seedOrders(repos, orders) {
  for (const spec of orders) {
    await saveSeededOrder(repos, spec);
  }
}

function applyTheme(repos, theme) {
  return done(repos.changeTheme.changeTheme({theme}));
}

function done(observable) {
  return new Promise((resolve, reject) => {
    let value;
    let settled = false;
    const finish = (handler, arg) => {
      if (settled) {
        return;
      }
      settled = true;
      handler(arg);
    };
    try {
      observable.subscribe(
        next => {
          value = next;
        },
        error => finish(reject, error),
        () => finish(resolve, value)
      );
    } catch (error) {
      finish(reject, error);
    }
  });
}

module.exports = {
  seedShop,
  seedTheme
};
