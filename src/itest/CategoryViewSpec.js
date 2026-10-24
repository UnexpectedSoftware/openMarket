import fs from 'fs';
import os from 'os';
import path from 'path';
import {expect} from 'chai';
import Category from '../openMarket/domain/category/Category';
import CategoryView from '../openMarket/domain/category/CategoryView';
import CategoriesQuery from '../openMarket/domain/category/CategoriesQuery';
import SqliteConnection from '../openMarket/infrastructure/service/SqliteConnection';
import SqliteCategoryQueryService from '../openMarket/infrastructure/category/SqliteCategoryQueryService';
import SqliteCategoryRepository from '../openMarket/infrastructure/category/SqliteCategoryRepository';
import ImageStore from '../openMarket/infrastructure/service/ImageStore';

describe('CategoryRepository find', () => {
  /** @type {string} */
  let file;
  /** @type {SqliteConnection} */
  let connection;
  /** @type {string} */
  let directory;

  beforeEach(() => {
    file = path.join(os.tmpdir(), `om-category-view-${Date.now()}-${Math.random()}.sqlite`);
    directory = fs.mkdtempSync(path.join(os.tmpdir(), 'openmarket-category-view-'));
    connection = new SqliteConnection({filename: file});
    connection.database.prepare('INSERT INTO category (id, name, image_name) VALUES (?, ?, ?)').run('alpha', 'Alpha', 'missing.png');
    connection.database.prepare('INSERT INTO category (id, name) VALUES (?, ?)').run('beta', 'beta');
    connection.database.prepare(
      'INSERT INTO product (barcode, name, base_price, stock, status, category_id) VALUES (?, ?, ?, ?, ?, ?)'
    ).run('1001', 'Milk', 1.5, 4, 'ENABLED', 'alpha');
  });

  afterEach(() => {
    connection.database.close();
    fs.rmSync(file, {force: true});
    fs.rmSync(`${file}-wal`, {force: true});
    fs.rmSync(`${file}-shm`, {force: true});
    fs.rmSync(directory, {recursive: true, force: true});
  });

  it('reads two categories in name order with integer cents and a null image', () => {
    const page = read(repository(connection, directory), new CategoriesQuery({}));
    expect(page.total).to.equal(2);
    expect(page.items.map(item => item.name)).to.deep.equal(['Alpha', 'beta']);
    const alpha = page.items[0];
    expect(alpha).to.be.instanceof(CategoryView);
    expect(alpha).to.not.be.instanceof(Category);
    expect(Object.isFrozen(alpha)).to.equal(true);
    expect(alpha.productCount).to.equal(1);
    expect(alpha.basePriceCents).to.equal(150);
    expect(alpha.stockTotal).to.equal(4);
    expect(alpha.mostSold).to.equal(null);
    expect(alpha.imageUrl).to.equal(null);
    const beta = page.items[1];
    expect(beta.productCount).to.equal(0);
    expect(beta.basePriceCents).to.equal(0);
    expect(beta.stockTotal).to.equal(0);
  });

  it('filters by name and reports the size of the filter, not the page', () => {
    const categories = repository(connection, directory);
    const matched = read(categories, new CategoriesQuery({text: 'alp'}));
    expect(matched.total).to.equal(1);
    expect(matched.items.map(item => item.name)).to.deep.equal(['Alpha']);
    const page = read(categories, new CategoriesQuery({limit: 1, offset: 0}));
    expect(page.total).to.equal(2);
    expect(page.items).to.have.length(1);
    const none = read(categories, new CategoriesQuery({text: 'zzz'}));
    expect(none.total).to.equal(0);
    expect(none.items).to.deep.equal([]);
  });
});

/**
 * @param {SqliteConnection} connection
 * @param {string} directory
 * @returns {SqliteCategoryRepository}
 */
function repository(connection, directory) {
  return new SqliteCategoryRepository({
    connection,
    categoryFactory: {
      createWithId() {
        throw new Error('find built a Category');
      }
    },
    images: new ImageStore({directory}),
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
