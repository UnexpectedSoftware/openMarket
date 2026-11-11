import { expect } from 'chai';
import SqliteConnection from '../../../../openMarket/infrastructure/service/SqliteConnection';
import { createFixtureInserter } from '../../../../openMarket/infrastructure/service/sqliteSeed';
import InvoiceNumber from '../../../../openMarket/domain/invoice/InvoiceNumber';
import Order from '../../../../openMarket/domain/order/Order';
import InvalidOrderLineError from '../../../../openMarket/domain/order/InvalidOrderLineError';
import VatRate from '../../../../openMarket/domain/tax/VatRate';
import placedOrder from '../../support/placedOrder';

const date = '01/07/2017 17:53:04';
const milk = {barcode: '2002', name: 'Milk', price: '1.10', quantity: 2, weighted: false};

function memory() {
  return new SqliteConnection({filename: ':memory:'}).database;
}

function count(database, table) {
  return database.prepare('SELECT COUNT(*) AS total FROM ' + table).get().total;
}

describe('Fixture inserter', () => {
  it('cannot build a sold line without a barcode, a name, or a price', () => {
    const order = Order.draft({id: '1', date});

    expect(() => order.addLine({price: 1, quantity: 1, vatRate: VatRate.standard()})).to.throw(InvalidOrderLineError);
    expect(() => order.addLine({...milk, barcode: ''})).to.throw(InvalidOrderLineError);
    expect(() => order.addLine({...milk, name: '  '})).to.throw(InvalidOrderLineError);
    expect(() => order.addLine({...milk, price: null})).to.throw(InvalidOrderLineError);
    expect(order.lines).to.deep.equal([]);
  });

  it('accepts only placed orders', () => {
    const database = memory();
    const inserter = createFixtureInserter(database);
    const draft = Order.draft({id: '1', date}).addLine(milk);

    expect(() => inserter.insertOrder({order: draft, invoice: null})).to.throw(TypeError, 'placed Order');
    expect(() => inserter.insertOrder(/** @type {*} */ ({order: {id: '1', lines: []}}))).to.throw(TypeError);
    expect(count(database, '"order"')).to.equal(0);
    expect(count(database, 'line')).to.equal(0);
  });

  it('stores a placed order, its lines, its payment, and its invoice', () => {
    const database = memory();
    const inserter = createFixtureInserter(database);
    inserter.insertProfile(null);
    const {order} = placedOrder({
      id: '7',
      date,
      lines: [
        milk,
        {barcode: '3003', name: 'Ham', price: '18.50', quantity: '0.35', weighted: true, vatRate: VatRate.standard(10)}
      ],
      payment: {method: 'cash', tenderedCents: 1000}
    });
    inserter.insertOrder({order, invoice: new InvoiceNumber({series: '2017', number: 4})});

    expect(database.prepare(
      'SELECT id, created_at, total_cents, payment_method, tendered_cents, change_cents FROM "order"'
    ).get()).to.deep.equal({
      id: '7',
      created_at: '2017-07-01 17:53:04',
      total_cents: 868,
      payment_method: 'cash',
      tendered_cents: 1000,
      change_cents: 132
    });
    expect(database.prepare(
      'SELECT barcode, name, price_cents, quantity_milli, amount_cents, vat_percent, vat_kind, vat_cause, kind FROM line ORDER BY barcode'
    ).all()).to.deep.equal([
      {barcode: '2002', name: 'Milk', price_cents: 110, quantity_milli: 2000, amount_cents: 220,
        vat_percent: 21, vat_kind: 'S1', vat_cause: null, kind: 'PRODUCT'},
      {barcode: '3003', name: 'Ham', price_cents: 1850, quantity_milli: 350, amount_cents: 648,
        vat_percent: 10, vat_kind: 'S1', vat_cause: null, kind: 'PRODUCT'}
    ]);
    expect(database.prepare(
      'SELECT id, series, number, invoice_number, issue_date, issuer_json, order_id, total_cents FROM invoice'
    ).get()).to.deep.equal({
      id: 'inv-7',
      series: '2017',
      number: 4,
      invoice_number: '2017/000004',
      issue_date: '2017-07-01',
      issuer_json: null,
      order_id: '7',
      total_cents: 868
    });
    expect(database.prepare(
      'SELECT position, barcode, name, amount, amount_cents, quantity_milli, kind, weighted FROM invoice_line ORDER BY position'
    ).all()).to.deep.equal([
      {position: 0, barcode: '2002', name: 'Milk', amount: 2.2, amount_cents: 220, quantity_milli: 2000, kind: 'PRODUCT', weighted: 0},
      {position: 1, barcode: '3003', name: 'Ham', amount: 6.48, amount_cents: 648, quantity_milli: 350, kind: 'PRODUCT', weighted: 1}
    ]);
    expect(database.prepare('SELECT percent, gross_cents FROM invoice_vat ORDER BY percent').all())
      .to.deep.equal([{percent: 10, gross_cents: 648}, {percent: 21, gross_cents: 220}]);
    expect(database.prepare('SELECT last_number FROM invoice_sequence WHERE series = ?').get('2017').last_number)
      .to.equal(4);
  });

  it('gives a repeated order id the next free suffix', () => {
    const database = memory();
    const inserter = createFixtureInserter(database);
    inserter.insertOrder(placedOrder({id: 'same', date, lines: [milk]}));
    inserter.insertOrder(placedOrder({id: 'same', date: '02/07/2017 17:53:04', lines: [milk]}));
    inserter.insertOrder(placedOrder({id: 'same', date: '03/07/2017 17:53:04', lines: [milk]}));

    const orders = database.prepare('SELECT id, payment_method FROM "order" ORDER BY created_at').all();
    expect(orders).to.deep.equal([
      {id: 'same', payment_method: null},
      {id: 'same#2', payment_method: null},
      {id: 'same#3', payment_method: null}
    ]);
    expect(database.prepare('SELECT order_id FROM line ORDER BY order_id').all().map(row => row.order_id))
      .to.deep.equal(['same', 'same#2', 'same#3']);
    expect(count(database, 'invoice')).to.equal(0);
  });

  it('creates a missing category for a product and stores its unknown fields as null', () => {
    const database = memory();
    const inserter = createFixtureInserter(database);
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

    expect(database.prepare(
      'SELECT name, price, category_id, vat_percent, vat_kind, vat_cause, image_name FROM product'
    ).get()).to.deep.equal({
      name: null,
      price: null,
      category_id: 'missing',
      vat_percent: 21,
      vat_kind: 'S1',
      vat_cause: null,
      image_name: null
    });
    expect(database.prepare('SELECT name FROM category WHERE id = ?').get('missing').name).to.equal('missing');
  });
});
