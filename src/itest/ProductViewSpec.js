import fs from 'fs';
import os from 'os';
import path from 'path';
import {expect} from 'chai';
import Product from '../openMarket/domain/product/Product';
import ProductDetail from '../openMarket/domain/product/ProductDetail';
import ProductDetailQuery from '../openMarket/domain/product/ProductDetailQuery';
import ProductView from '../openMarket/domain/product/ProductView';
import ProductsQuery from '../openMarket/domain/product/ProductsQuery';
import SqliteConnection from '../openMarket/infrastructure/service/SqliteConnection';
import SqliteProductQueryService from '../openMarket/infrastructure/product/SqliteProductQueryService';
import SqliteProductRepository from '../openMarket/infrastructure/product/SqliteProductRepository';

describe('ProductRepository find', () => {
  let file;
  let connection;

  beforeEach(() => {
    file = path.join(os.tmpdir(), `om-product-view-${Date.now()}-${Math.random()}.sqlite`);
    connection = new SqliteConnection({filename: file});
    connection.database.prepare('INSERT INTO category (id, name) VALUES (?, ?)').run('dairy', 'Dairy');
    connection.database.prepare('INSERT INTO category (id, name) VALUES (?, ?)').run('deli', 'Deli');
    insert(connection, {
      barcode: '0001', name: 'Milk', priceCents: 200, basePriceCents: 100,
      stock: 1, stockMin: 4, status: 'ENABLED', weighted: 0, categoryId: 'dairy',
      vatPercent: 10, vatKind: 'S1'
    });
    insert(connection, {
      barcode: '0002', name: 'Ham', priceCents: 1850, basePriceCents: 1150,
      stock: 5, stockMin: 1, status: 'ENABLED', weighted: 1, categoryId: 'deli',
      vatPercent: 21, vatKind: 'S1', vatCause: 'nope'
    });
    insert(connection, {
      barcode: '0003', name: 'Old bread', priceCents: 100, basePriceCents: 70,
      stock: 0, stockMin: 1, status: 'DISABLED', weighted: 0, categoryId: 'dairy',
      vatPercent: 21, vatKind: 'S1'
    });
  });

  afterEach(() => {
    connection.database.close();
    fs.rmSync(file, {force: true});
    fs.rmSync(`${file}-wal`, {force: true});
    fs.rmSync(`${file}-shm`, {force: true});
  });

  it('returns enabled products for sale, ordered by name, with cents and vat', () => {
    const page = read(repository(connection, null), new ProductsQuery({forSale: true}));
    expect(page.total).to.equal(2);
    expect(page.items.map(item => item.barcode)).to.deep.equal(['0002', '0001']);
    const milk = page.items[1];
    expect(milk).to.be.instanceof(ProductView);
    expect(milk).to.not.be.instanceof(Product);
    expect(Object.isFrozen(milk)).to.equal(true);
    expect(milk.name).to.equal('Milk');
    expect(milk.priceCents).to.equal(200);
    expect(milk.basePriceCents).to.equal(100);
    expect(milk.marginPercent).to.equal(50);
    expect(milk.vat).to.deep.equal({kind: 'S1', percent: 10, cause: null});
    expect(milk.weighted).to.equal(false);
    expect(milk.lowStock).to.equal(true);
    expect(milk.categoryName).to.equal('Dairy');
    expect(milk.status).to.equal('ENABLED');
    expect(milk.imageUrl).to.equal(null);
    expect(milk.addStock).to.equal(undefined);
    const ham = page.items[0];
    expect(ham.priceCents).to.equal(1850);
    expect(ham.marginPercent).to.equal(38);
    expect(ham.weighted).to.equal(true);
    expect(ham.lowStock).to.equal(false);
    expect(ham.vat.cause).to.equal('nope');
  });

  it('filters a sale by text and category', () => {
    const products = repository(connection, null);
    const byText = read(products, new ProductsQuery({text: 'mi', forSale: true}));
    expect(byText.items.map(item => item.barcode)).to.deep.equal(['0001']);
    expect(byText.total).to.equal(1);
    const byCategory = read(products, new ProductsQuery({categoryId: 'deli', forSale: true}));
    expect(byCategory.items.map(item => item.barcode)).to.deep.equal(['0002']);
    expect(byCategory.items[0].categoryId).to.equal('deli');
  });

  it('includes a disabled row in a management find and reports the whole total', () => {
    const page = read(repository(connection, null), new ProductsQuery({status: null, limit: 1, offset: 0}));
    expect(page.total).to.equal(3);
    expect(page.items).to.have.lengthOf(1);
    expect(page.items[0]).to.be.instanceof(ProductView);
    expect(page.items[0]).to.not.be.instanceof(Product);
    const rest = read(repository(connection, null), new ProductsQuery({limit: 1, offset: 2, sort: 'name_asc'}));
    expect(rest.total).to.equal(3);
    expect(rest.items.map(item => item.name)).to.deep.equal(['Old bread']);
    expect(rest.items[0].status).to.equal('DISABLED');
  });

  it('filters management rows by category, text, status, weight, and low stock', () => {
    const products = repository(connection, null);
    expect(names(products, {text: 'old'})).to.deep.equal(['Old bread']);
    expect(names(products, {categoryId: 'dairy', sort: 'name_asc'})).to.deep.equal(['Milk', 'Old bread']);
    expect(names(products, {status: 'DISABLED'})).to.deep.equal(['Old bread']);
    expect(names(products, {status: 'ENABLED', sort: 'name_asc'})).to.deep.equal(['Ham', 'Milk']);
    expect(names(products, {weighted: true})).to.deep.equal(['Ham']);
    expect(names(products, {weighted: false, sort: 'name_asc'})).to.deep.equal(['Milk', 'Old bread']);
    expect(names(products, {lowStock: true, sort: 'stock_asc'})).to.deep.equal(['Old bread', 'Milk']);
    expect(names(products, {text: '0002'})).to.deep.equal(['Ham']);
  });

  it('sorts by name and by stock', () => {
    const products = repository(connection, null);
    expect(names(products, {sort: 'name_desc'})).to.deep.equal(['Old bread', 'Milk', 'Ham']);
    expect(names(products, {sort: 'stock_asc'})).to.deep.equal(['Old bread', 'Milk', 'Ham']);
    expect(names(products, {sort: 'stock_desc'})).to.deep.equal(['Ham', 'Milk', 'Old bread']);
    expect(names(products, {sort: 'nope'})).to.deep.equal(['Ham', 'Milk', 'Old bread']);
  });

  it('leaves imageUrl null when there is no image store', () => {
    connection.database.prepare('UPDATE product SET image_name = ? WHERE barcode = ?').run('ham.png', '0002');
    const page = read(repository(connection, null), new ProductsQuery({forSale: true, text: 'ham'}));
    expect(page.items[0].imageUrl).to.equal(null);
  });

  it('reads an image url from the store and leaves a missing file null', () => {
    connection.database.prepare('UPDATE product SET image_name = ? WHERE barcode = ?').run('ham.png', '0002');
    connection.database.prepare('UPDATE product SET image_name = ? WHERE barcode = ?').run('gone.png', '0001');
    const images = {
      readDataUrl(name) {
        return name === 'ham.png' ? 'data:image/png;base64,ham' : null;
      }
    };
    const page = read(repository(connection, images), new ProductsQuery({forSale: true}));
    const byBarcode = {};
    page.items.forEach(item => {
      byBarcode[item.barcode] = item.imageUrl;
    });
    expect(byBarcode['0002']).to.equal('data:image/png;base64,ham');
    expect(byBarcode['0001']).to.equal(null);
  });

  it('reads a legacy euro price and a literal percent in the name', () => {
    insert(connection, {
      barcode: '0004', name: 'Legacy', price: 1.25, basePrice: 0.5,
      stock: null, stockMin: null, status: 'ENABLED', weighted: null, categoryId: null
    });
    insert(connection, {
      barcode: '0005', name: '100% juice', priceCents: 300, basePriceCents: 150,
      stock: 2, stockMin: 2, status: 'ENABLED', weighted: 0, categoryId: 'dairy',
      vatPercent: 21, vatKind: 'S1'
    });
    const products = repository(connection, null);
    const legacy = read(products, new ProductsQuery({text: 'legacy'})).items[0];
    expect(legacy.priceCents).to.equal(125);
    expect(legacy.basePriceCents).to.equal(50);
    expect(legacy.marginPercent).to.equal(60);
    expect(legacy.vat).to.deep.equal({kind: 'S1', percent: 21, cause: null});
    expect(legacy.stock).to.equal(null);
    expect(legacy.stockMin).to.equal(null);
    expect(legacy.lowStock).to.equal(false);
    expect(legacy.categoryId).to.equal(null);
    expect(legacy.categoryName).to.equal(null);
    expect(legacy.weighted).to.equal(false);
    const juice = read(products, new ProductsQuery({text: '%'})).items;
    expect(juice.map(item => item.barcode)).to.deep.equal(['0005']);
  });

  it('returns every management row when no limit is given', () => {
    const page = read(repository(connection, null), new ProductsQuery({}));
    expect(page.total).to.equal(3);
    expect(page.items).to.have.lengthOf(3);
  });
});

describe('ProductRepository findDetail', () => {
  let file;
  let connection;

  beforeEach(() => {
    file = path.join(os.tmpdir(), `om-product-detail-${Date.now()}-${Math.random()}.sqlite`);
    connection = new SqliteConnection({filename: file});
    connection.database.prepare('INSERT INTO category (id, name) VALUES (?, ?)').run('deli', 'Deli');
    insert(connection, {
      barcode: '0002', name: 'Ham', priceCents: 1850, basePriceCents: 1150,
      stock: 5, stockMin: 1, status: 'ENABLED', weighted: 1, categoryId: 'deli',
      vatPercent: 10, vatKind: 'S1', description: 'Sliced', imageName: 'ham.png'
    });
  });

  afterEach(() => {
    connection.database.close();
    fs.rmSync(file, {force: true});
    fs.rmSync(`${file}-wal`, {force: true});
    fs.rmSync(`${file}-shm`, {force: true});
  });

  it('returns vat, cents, the category name, weight, and the description', () => {
    const images = {readDataUrl: name => (name ? `data:${name}` : null)};
    const detail = readDetail(repository(connection, images), new ProductDetailQuery({barcode: '0002'}));
    expect(detail).to.be.instanceof(ProductDetail);
    expect(detail).to.not.be.instanceof(Product);
    expect(Object.isFrozen(detail)).to.equal(true);
    expect(detail.priceCents).to.equal(1850);
    expect(detail.basePriceCents).to.equal(1150);
    expect(detail.marginPercent).to.equal(38);
    expect(detail.vat).to.deep.equal({kind: 'S1', percent: 10, cause: null});
    expect(detail.categoryName).to.equal('Deli');
    expect(detail.categoryId).to.equal('deli');
    expect(detail.weighted).to.equal(true);
    expect(detail.description).to.equal('Sliced');
    expect(detail.imageName).to.equal('ham.png');
    expect(detail.imageUrl).to.equal('data:ham.png');
    expect(detail.lowStock).to.equal(false);
  });

  it('completes empty for an unknown barcode and when no image store is wired', () => {
    const missing = readDetail(repository(connection, null), new ProductDetailQuery({barcode: 'missing'}));
    expect(missing).to.equal(null);
    const blank = readDetail(repository(connection, null), new ProductDetailQuery());
    expect(blank).to.equal(null);
    const stored = readDetail(repository(connection, null), new ProductDetailQuery({barcode: '0002'}));
    expect(stored.imageUrl).to.equal(null);
    expect(stored).to.not.be.instanceof(Product);
  });
});

/**
 * @param {SqliteConnection} connection
 * @param {object} row
 */
function insert(connection, row) {
  const columns = ['barcode', 'name', 'status'];
  const values = [row.barcode, row.name, row.status];
  optional(columns, values, 'price', row.price);
  optional(columns, values, 'price_cents', row.priceCents);
  optional(columns, values, 'base_price', row.basePrice);
  optional(columns, values, 'base_price_cents', row.basePriceCents);
  optional(columns, values, 'stock', row.stock);
  optional(columns, values, 'stock_min', row.stockMin);
  optional(columns, values, 'weighted', row.weighted);
  optional(columns, values, 'category_id', row.categoryId);
  optional(columns, values, 'vat_percent', row.vatPercent);
  optional(columns, values, 'vat_kind', row.vatKind);
  optional(columns, values, 'vat_cause', row.vatCause);
  optional(columns, values, 'description', row.description);
  optional(columns, values, 'image_name', row.imageName);
  connection.database.prepare(
    `INSERT INTO product (${columns.join(', ')}) VALUES (${columns.map(() => '?').join(', ')})`
  ).run(...values);
}

/**
 * @param {string[]} columns
 * @param {Array<*>} values
 * @param {string} column
 * @param {*} value
 */
function optional(columns, values, column, value) {
  if (value === undefined) {
    return;
  }
  columns.push(column);
  values.push(value);
}

/**
 * @param {SqliteConnection} connection
 * @param {{readDataUrl: (name: string) => (string | null)} | null} images
 * @returns {SqliteProductRepository}
 */
function repository(connection, images) {
  return new SqliteProductRepository({
    connection,
    productMapper: {},
    images,
    queryService: new SqliteProductQueryService()
  });
}

/**
 * @param {SqliteProductRepository} products
 * @param {ProductsQuery} query
 * @returns {{items: ProductView[], total: number}}
 */
function read(products, query) {
  let page = null;
  let failure = null;
  products.find(query).subscribe(value => {
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
 * @param {SqliteProductRepository} products
 * @param {object} criteria
 * @returns {string[]}
 */
/**
 * @param {SqliteProductRepository} products
 * @param {ProductDetailQuery} query
 * @returns {ProductDetail | null}
 */
function readDetail(products, query) {
  let detail = null;
  let failure = null;
  let saw = false;
  products.findDetail(query).subscribe(value => {
    saw = true;
    detail = value;
  }, error => {
    failure = error;
  });
  if (failure) {
    throw failure;
  }
  return saw ? detail : null;
}

function names(products, criteria) {
  return read(products, new ProductsQuery(criteria)).items.map(item => item.name);
}
