import { expect } from 'chai';
import SqliteConnection from '../../../../openMarket/infrastructure/service/SqliteConnection';
import { createFixtureInserter } from '../../../../openMarket/infrastructure/service/sqliteSeed';

describe('Fixture inserter', () => {
  it('stores missing money as null, creates a category, and keeps a repeated order id', () => {
    const database = new SqliteConnection({filename: ':memory:'}).database;
    const inserter = createFixtureInserter(database);
    inserter.insertProfile(null);
    inserter.insertProduct({
      _barcode: '2002',
      _name: null,
      _description: null,
      _price: null,
      _basePrice: null,
      _stock: null,
      _stockMin: null,
      _status: null,
      _weighted: null,
      _categoryId: 'missing',
      _vatPercent: null,
      _vatKind: '',
      _vatCause: '',
      _imageName: null
    });
    inserter.insertOrder({
      _id: 'same',
      _createdAt: '01/07/2017 17:53:04',
      _total: 1,
      _lines: [
        {barcode: '2002', name: 'Plain', price: null, quantity: null, amount: 1},
        {price: 1, quantity: -1, vatKind: 'S1', vatCause: 'E1', weighted: false}
      ]
    });
    inserter.insertOrder({
      _id: 'same',
      _createdAt: '02/07/2017 17:53:04',
      _total: 0,
      _payment: {method: null, tenderedCents: null, changeCents: null, parts: null}
    });

    const product = database.prepare(
      'SELECT name, price, category_id, vat_percent, vat_kind, vat_cause, image_name FROM product'
    ).get();
    expect(product).to.deep.equal({
      name: null,
      price: null,
      category_id: 'missing',
      vat_percent: 21,
      vat_kind: 'S1',
      vat_cause: null,
      image_name: null
    });
    expect(database.prepare('SELECT name FROM category WHERE id = ?').get('missing').name).to.equal('missing');
    const orders = database.prepare('SELECT id, payment_method FROM "order" ORDER BY id').all();
    expect(orders.map(row => row.id)).to.deep.equal(['same', 'same#2']);
    expect(orders[1].payment_method).to.equal(null);
    expect(database.prepare('SELECT COUNT(*) AS total FROM invoice').get().total).to.equal(0);
    const amounts = database.prepare('SELECT amount_cents FROM line ORDER BY amount_cents').all();
    expect(amounts.map(row => row.amount_cents)).to.deep.equal([0, 100]);
  });
});
