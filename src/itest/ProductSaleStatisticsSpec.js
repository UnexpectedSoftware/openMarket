import {expect} from 'chai';
import openMarket from '../openMarket/application/index';
import container from '../openMarket/infrastructure/dic/Container';
import {replaceSqliteData} from '../openMarket/infrastructure/service/sqliteSeed';
import OrderCreated from '../openMarket/domain/event/OrderCreated';

const database = container.getInstance({key: 'sqliteConnection'}).database;
const createOrder = openMarket.get('orders_create_use_case');
const sales = openMarket.get('product_sale_statistics_use_case');
const domainEventBus = openMarket.get('domain_event_bus');

const product = {
  _id: 'Seq-0',
  _barcode: '0001',
  _name: 'Coca-Cola',
  _description: '',
  _price: 0.55,
  _basePrice: 0.3,
  _stock: 100,
  _stockMin: 10,
  _imageUrl: 'a',
  _categoryId: '1',
  _status: 'ENABLED'
};

describe('Product sale statistics', () => {
  beforeEach(() => {
    replaceSqliteData(database, {products: [product]});
  });

  it('records each created order and accumulates the same product', (done) => {
    const events = [];
    const subscription = domainEventBus.ofType(OrderCreated).subscribe(event => events.push(event));
    const lines = [
      {barcode: '0001', name: 'Coca-Cola', price: 0.55, quantity: 2},
      {barcode: '0001', name: 'Coca-Cola', price: 0.55, quantity: 3}
    ];

    createOrder.createOrder({lines})
      .flatMap(() => createOrder.createOrder({
        lines: [{barcode: '0001', name: 'Coca-Cola', price: 0.55, quantity: 1}]
      }))
      .flatMap(() => sales.salesOfProduct({barcode: '0001', window: 'day'}))
      .subscribe(
        result => {
          expect(events).to.have.lengthOf(2);
          expect(events[0]).to.be.instanceof(OrderCreated);
          expect(events[0].lines).to.have.lengthOf(2);
          expect(events[0].lines[0]).to.not.equal(lines[0]);
          expect(events[0].lines[0]).to.deep.equal(lines[0]);
          expect(result.quantity).to.equal(6);
          expect(result.amount).to.equal(3.3);
        },
        error => {
          subscription.unsubscribe();
          done(error instanceof Error ? error : new Error(error));
        },
        () => {
          subscription.unsubscribe();
          done();
        }
      );
  });

  it('rebuilds counters from orders inserted without an event', () => {
    replaceSqliteData(database, {
      products: [product],
      orders: [
        {
          _id: 'h1',
          _createdAt: '02/03/2020 10:00:00',
          _lines: [{barcode: '0001', name: 'Coca-Cola', price: 0.55, quantity: 2}],
          _total: 1.1
        },
        {
          _id: 'h2',
          _createdAt: '02/03/2020 11:00:00',
          _lines: [{barcode: '0001', name: 'Coca-Cola', price: 0.55, quantity: 3}],
          _total: 1.65
        }
      ]
    });

    sales.rebuildFromOrders();
    const row = database.prepare(
      'SELECT quantity, amount FROM product_sale_day WHERE barcode = ? AND sold_on = ?'
    ).get('0001', '2020-03-02');
    expect(row.quantity).to.equal(5);
    expect(row.amount).to.equal(2.75);
  });
});
