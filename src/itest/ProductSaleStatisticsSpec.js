import {expect} from 'chai';
import 'rxjs/add/operator/do';
import openMarket from '../openMarket/application/index';
import container from '../openMarket/infrastructure/dic/Container';
import OrderCreated from '../openMarket/domain/event/OrderCreated';
import placedOrder from '../test/openMarket/support/placedOrder';
import seedShop from '../test/openMarket/support/seedShop';
import {shopCategory, shopProduct} from '../test/openMarket/support/catalog';
import Money from '../openMarket/domain/money/Money';
import Quantity from '../openMarket/domain/money/Quantity';

const database = container.getInstance({key: 'sqliteConnection'}).database;
const createOrder = openMarket.get('orders_create_use_case');
const sales = openMarket.get('product_sale_statistics_use_case');
const domainEventBus = openMarket.get('domain_event_bus');
const dispatcher = container.getInstance({key: 'domainEventDispatcher'});

const product = shopProduct({barcode: '0001', name: 'Coca-Cola', price: '0.55', basePrice: '0.30', stock: 100, stockMin: 10});

describe('Product sale statistics', () => {
  beforeEach(() => {
    seedShop(container, {categories: [shopCategory('1')], products: [product]});
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
      .do(() => dispatcher.dispatch())
      .flatMap(() => sales.salesOfProduct({barcode: '0001', window: 'day'}))
      .subscribe(
        result => {
          expect(events).to.have.lengthOf(2);
          expect(events[0]).to.be.instanceof(OrderCreated);
          expect(events[0].lines).to.have.lengthOf(2);
          expect(events[0].lines[0]).to.not.equal(lines[0]);
          expect(events[0].lines[0]).to.deep.equal({
            barcode: '0001',
            name: 'Coca-Cola',
            price: 0.55,
            quantity: 2,
            amount: 1.1,
            priceCents: 55,
            quantityMilli: 2000,
            amountCents: 110
          });
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
    seedShop(container, {
      categories: [shopCategory('1')],
      products: [product],
      orders: [
        placedOrder({id: 'h1', date: '02/03/2020 10:00:00', lines: [{barcode: '0001', name: 'Coca-Cola', price: Money.fromEuros('0.55'), quantity: Quantity.from(2)}]}),
        placedOrder({id: 'h2', date: '02/03/2020 11:00:00', lines: [{barcode: '0001', name: 'Coca-Cola', price: Money.fromEuros('0.55'), quantity: Quantity.from(3)}]})
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
