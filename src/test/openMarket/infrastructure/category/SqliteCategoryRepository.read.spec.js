import fs from 'fs';
import os from 'os';
import path from 'path';
import {expect} from 'chai';
import Category from '../../../../openMarket/domain/category/Category';
import CategoryView from '../../../../openMarket/domain/category/CategoryView';
import CategoriesQuery from '../../../../openMarket/domain/category/CategoriesQuery';
import SqliteConnection from '../../../../openMarket/infrastructure/service/SqliteConnection';
import SqliteCategoryQueryService from '../../../../openMarket/infrastructure/category/SqliteCategoryQueryService';
import SqliteCategoryRepository from '../../../../openMarket/infrastructure/category/SqliteCategoryRepository';
import ImageStore from '../../../../openMarket/infrastructure/service/ImageStore';

const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64'
);

describe('SqliteCategoryRepository find', () => {
  /** @type {SqliteConnection} */
  let connection;
  /** @type {{calls: string[], readDataUrl: (name: string) => string}} */
  let images;

  beforeEach(() => {
    connection = new SqliteConnection({filename: ':memory:'});
    images = {
      calls: [],
      readDataUrl(name) {
        this.calls.push(name);
        if (!name) {
          return 'called-without-a-name';
        }
        return 'data:' + name;
      }
    };
    insertCategory(connection, {id: 'alpha', name: 'Alpha'});
    insertCategory(connection, {id: 'beta', name: 'beta'});
    insertProduct(connection, {
      barcode: '1001', name: 'Milk', basePrice: 1.5, stock: 4, status: 'ENABLED', categoryId: 'alpha'
    });
  });

  afterEach(() => {
    connection.database.close();
  });

  it('returns cents, counts every row, and does not build a Category', () => {
    const page = read(repository(connection, images), new CategoriesQuery({}));
    expect(page.total).to.equal(2);
    expect(page.items.map(item => item.name)).to.deep.equal(['Alpha', 'beta']);
    const alpha = page.items[0];
    expect(alpha).to.be.instanceof(CategoryView);
    expect(alpha).to.not.be.instanceof(Category);
    expect(Object.isFrozen(alpha)).to.equal(true);
    expect(alpha.id).to.equal('alpha');
    expect(alpha.productCount).to.equal(1);
    expect(alpha.basePriceCents).to.equal(150);
    expect(alpha.stockTotal).to.equal(4);
    expect(alpha.mostSold).to.equal(null);
    expect(alpha.imageUrl).to.equal(null);
    expect(alpha.imageName).to.equal(undefined);
    expect(images.calls).to.deep.equal([]);
    const beta = page.items[1];
    expect(beta.productCount).to.equal(0);
    expect(beta.basePriceCents).to.equal(0);
    expect(beta.stockTotal).to.equal(0);
    expect(beta.mostSold).to.equal(null);

    const summaries = readSummaries(repository(connection, images));
    expect(summaries.find(item => item.name === 'Alpha').basePriceTotal).to.equal(1.5);
    expect(summaries.find(item => item.name === 'beta').basePriceTotal).to.equal(0);
  });

  it('filters by name, keeps the whole total, and ignores offset without a limit', () => {
    const categories = repository(connection, images);
    const byName = read(categories, new CategoriesQuery({text: 'ALP'}));
    expect(byName.total).to.equal(1);
    expect(byName.items.map(item => item.name)).to.deep.equal(['Alpha']);
    const none = read(categories, new CategoriesQuery({text: 'zzz'}));
    expect(none.total).to.equal(0);
    expect(none.items).to.deep.equal([]);
    const page = read(categories, new CategoriesQuery({limit: 1, offset: 1, sort: 'stock_desc'}));
    expect(page.total).to.equal(2);
    expect(page.items.map(item => item.name)).to.deep.equal(['beta']);
    const first = read(categories, new CategoriesQuery({limit: 1, offset: 0}));
    expect(first.items.map(item => item.name)).to.deep.equal(['Alpha']);
    const unpaged = read(categories, new CategoriesQuery({offset: 1}));
    expect(unpaged.total).to.equal(2);
    expect(unpaged.items).to.have.length(2);
  });

  it('counts a disabled product and prefers stored cents over the euro column', () => {
    insertProduct(connection, {
      barcode: '2001', name: 'Ham', basePrice: 9.99, basePriceCents: 200,
      stock: 1, status: 'DISABLED', categoryId: 'beta'
    });
    const beta = read(repository(connection, images), new CategoriesQuery({text: 'beta'})).items[0];
    expect(beta.productCount).to.equal(1);
    expect(beta.basePriceCents).to.equal(200);
    expect(beta.stockTotal).to.equal(1);
  });

  it('ranks most sold by quantity, then amount, then name', () => {
    insertCategory(connection, {id: 'qty', name: 'Quantity'});
    insertCategory(connection, {id: 'amt', name: 'Amount'});
    insertCategory(connection, {id: 'tie', name: 'Tie'});
    insertProduct(connection, {barcode: '1002', name: 'Apple', basePrice: 1, stock: 1, status: 'ENABLED', categoryId: 'qty'});
    insertProduct(connection, {barcode: '1003', name: 'Pear', basePrice: 1, stock: 1, status: 'ENABLED', categoryId: 'qty'});
    insertProduct(connection, {barcode: '3001', name: 'Fig', basePrice: 1, stock: 1, status: 'ENABLED', categoryId: 'amt'});
    insertProduct(connection, {barcode: '3002', name: 'Date', basePrice: 1, stock: 1, status: 'ENABLED', categoryId: 'amt'});
    insertProduct(connection, {barcode: '4001', name: 'Milk', basePrice: 1, stock: 1, status: 'ENABLED', categoryId: 'tie'});
    insertProduct(connection, {barcode: '4002', name: 'Cheese', basePrice: 1, stock: 1, status: 'ENABLED', categoryId: 'tie'});
    insertSale(connection, {barcode: '1002', name: 'Apple', quantity: 3, amountCents: 10000});
    insertSale(connection, {barcode: '1003', name: 'Pear', quantity: 4, amountCents: 100});
    insertSale(connection, {barcode: '3001', name: 'Fig', quantity: 2, amountCents: 50});
    insertSale(connection, {barcode: '3002', name: 'Date', quantity: 2, amountCents: 80});
    insertSale(connection, {barcode: '4001', name: 'Milk', quantity: 5, amountCents: 1200});
    insertSale(connection, {barcode: '4002', name: 'Cheese', quantity: 5, amountCents: 1200});
    insertSale(connection, {barcode: '9999', name: 'Gone', quantity: 99, amountCents: 9900});

    const items = read(repository(connection, images), new CategoriesQuery({})).items;
    expect(byName(items, 'Alpha').mostSold).to.equal(null);
    expect(byName(items, 'Quantity').mostSold).to.deep.equal({barcode: '1003', name: 'Pear', quantity: 4});
    expect(byName(items, 'Amount').mostSold).to.deep.equal({barcode: '3002', name: 'Date', quantity: 2});
    expect(byName(items, 'Tie').mostSold).to.deep.equal({barcode: '4002', name: 'Cheese', quantity: 5});
    expect(Object.isFrozen(byName(items, 'Tie').mostSold)).to.equal(true);
  });

  it('leaves imageUrl null when there is no store or the file is missing, and reads a stored file', () => {
    connection.database.prepare('UPDATE category SET image_name = ? WHERE id = ?').run('alpha.png', 'alpha');
    const missingStore = read(repository(connection, null), new CategoriesQuery({text: 'Alpha'})).items[0];
    expect(missingStore.imageUrl).to.equal(null);

    const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'openmarket-category-view-'));
    const stored = new ImageStore({directory});
    try {
      const absent = read(repository(connection, stored), new CategoriesQuery({text: 'Alpha'})).items[0];
      expect(absent.imageUrl).to.equal(null);
      fs.writeFileSync(path.join(directory, 'alpha.png'), PNG);
      const present = read(repository(connection, stored), new CategoriesQuery({text: 'Alpha'})).items[0];
      expect(present.imageUrl.startsWith('data:image/png;base64,')).to.equal(true);
    } finally {
      fs.rmSync(directory, {recursive: true, force: true});
    }
  });
});

/**
 * @param {SqliteConnection} connection
 * @param {{readDataUrl: (name: string) => (string | null)} | null} images
 * @returns {SqliteCategoryRepository}
 */
function repository(connection, images) {
  return new SqliteCategoryRepository({
    connection,
    categoryFactory: {
      createWithId() {
        throw new Error('find built a Category');
      }
    },
    images,
    queryService: new SqliteCategoryQueryService()
  });
}

/**
 * @param {SqliteCategoryRepository} categories
 * @param {CategoriesQuery} query
 * @returns {{items: CategoryView[], total: number}}
 */
function read(categories, query) {
  let page = null;
  let failure = null;
  categories.find(query).subscribe(value => {
    page = value;
  }, error => {
    failure = error;
  });
  if (failure) {
    throw failure;
  }
  return page;
}

/**
 * @param {SqliteCategoryRepository} categories
 * @returns {Array<{name: string, basePriceTotal: number}>}
 */
function readSummaries(categories) {
  let rows = null;
  let failure = null;
  categories.findAllWithStats().subscribe(value => {
    rows = value;
  }, error => {
    failure = error;
  });
  if (failure) {
    throw failure;
  }
  return rows;
}

/**
 * @param {CategoryView[]} items
 * @param {string} name
 * @returns {CategoryView}
 */
function byName(items, name) {
  return items.filter(item => item.name === name)[0];
}

/**
 * @param {SqliteConnection} connection
 * @param {{id: string, name: string}} category
 */
function insertCategory(connection, category) {
  connection.database.prepare('INSERT INTO category (id, name) VALUES (?, ?)').run(category.id, category.name);
}

/**
 * @param {SqliteConnection} connection
 * @param {{barcode: string, name: string, basePrice: number, basePriceCents?: number, stock: number, status: string, categoryId: string}} product
 */
function insertProduct(connection, product) {
  connection.database.prepare(
    'INSERT INTO product (barcode, name, base_price, base_price_cents, stock, status, category_id) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).run(
    product.barcode,
    product.name,
    product.basePrice,
    product.basePriceCents == null ? null : product.basePriceCents,
    product.stock,
    product.status,
    product.categoryId
  );
}

/**
 * @param {SqliteConnection} connection
 * @param {{barcode: string, name: string, quantity: number, amountCents: number}} sale
 */
function insertSale(connection, sale) {
  connection.database.prepare(
    'INSERT INTO product_sale_day (barcode, name, sold_on, quantity, amount, amount_cents) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(sale.barcode, sale.name, '2026-01-01', sale.quantity, sale.amountCents / 100, sale.amountCents);
}
