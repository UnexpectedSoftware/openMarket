import fs from 'fs';
import os from 'os';
import path from 'path';
import {expect} from 'chai';
import SqliteConnection from '../openMarket/infrastructure/service/SqliteConnection';
import SqliteProductsQuery from '../openMarket/infrastructure/product/SqliteProductsQuery';
import Product from '../openMarket/domain/product/Product';

describe('ProductsQuery', () => {
  let file;
  let connection;

  beforeEach(() => {
    file = path.join(os.tmpdir(), `om-sale-tiles-${Date.now()}-${Math.random()}.sqlite`);
    connection = new SqliteConnection({filename: file});
    const insert = connection.database.prepare(
      'INSERT INTO product (barcode, name, price, price_cents, stock, stock_min, status, weighted, category_id, vat_percent, vat_kind) ' +
      'VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    );
    insert.run('0001', 'Milk', 2, 200, 1, 4, 'ENABLED', 0, 'dairy', 10, 'S1');
    insert.run('0002', 'Ham', 18.5, 1850, 5, 1, 'ENABLED', 1, 'deli', 21, 'S1');
    insert.run('0003', 'Old bread', 1, 100, 0, 1, 'DISABLED', 0, 'dairy', 21, 'S1');
  });

  afterEach(() => {
    connection.database.close();
    fs.rmSync(file, {force: true});
  });

  it('returns plain sale tiles and skips disabled products', done => {
    const query = new SqliteProductsQuery({connection, images: null});
    query.listForSale({text: 'mi'}).subscribe(
      tiles => {
        expect(tiles).to.have.lengthOf(1);
        expect(tiles[0]).to.deep.equal({
          barcode: '0001',
          name: 'Milk',
          priceCents: 200,
          vatRate: {kind: 'S1', percent: 10, cause: null},
          weighted: false,
          lowStock: true,
          imageUrl: null
        });
        expect(tiles[0]).to.not.be.instanceof(Product);
        expect(tiles[0].addStock).to.equal(undefined);
      },
      error => done(error),
      () => done()
    );
  });

  it('filters by category and keeps a weighed product', done => {
    const query = new SqliteProductsQuery({connection, images: null});
    query.listForSale({categoryId: 'deli'}).subscribe(
      tiles => {
        expect(tiles.map(tile => tile.barcode)).to.deep.equal(['0002']);
        expect(tiles[0].weighted).to.equal(true);
        expect(tiles[0].lowStock).to.equal(false);
        expect(tiles[0].priceCents).to.equal(1850);
      },
      error => done(error),
      () => done()
    );
  });
});
