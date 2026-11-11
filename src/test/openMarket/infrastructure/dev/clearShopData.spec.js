import { expect } from 'chai';
import {Container} from '../../../../openMarket/infrastructure/dic/Container';
import SqliteConnection from '../../../../openMarket/infrastructure/service/SqliteConnection';
import { clearShopData } from '../../../../openMarket/infrastructure/dev/clearShopData';
import runNow from '../../../../openMarket/infrastructure/service/runNow';
import Money from '../../../../openMarket/domain/money/Money';
import Quantity from '../../../../openMarket/domain/money/Quantity';
import Payment from '../../../../openMarket/domain/payment/Payment';
import { buildProfile } from '../../../../openMarket/infrastructure/dev/demoShop';
import seedShop from '../../support/seedShop';
import { shopCategory, shopProduct } from '../../support/catalog';

const TABLES = ['category', 'product', '"order"', 'line', 'invoice', 'invoice_line', 'invoice_sequence', 'setting',
  'domain_event'];

class MemoryContainer extends Container {
  _sqliteConnection() {
    return new SqliteConnection({filename: ':memory:'});
  }
}

function count(database, table) {
  return database.prepare('SELECT COUNT(*) AS total FROM ' + table).get().total;
}

describe('clearShopData', () => {
  it('empties the shop a sale filled and keeps the invoice guards', () => {
    const container = new MemoryContainer({environment: 'test'});
    const database = container.getInstance({key: 'sqliteConnection'}).database;
    const category = shopCategory('1', 'Despensa');
    seedShop(container, {categories: [category], products: [shopProduct({barcode: '1001', name: 'Fideo', price: '1.25', category})]});
    runNow(container.getInstance({key: 'updateShopProfile'}).update(buildProfile()));
    const price = Money.fromEuros('1.25');
    runNow(container.getInstance({key: 'createOrderUseCase'}).createOrder({
      lines: [{barcode: '1001', name: 'Fideo', price, quantity: Quantity.from(2), weighted: false}],
      payment: Payment.card({total: Money.fromEuros('2.50')})
    }));
    TABLES.forEach(table => expect(count(database, table), table).to.be.above(0));

    clearShopData(database);

    TABLES.forEach(table => expect(count(database, table), table).to.equal(0));
    seedShop(container, {categories: [category], products: [shopProduct({barcode: '1001', name: 'Fideo', price: '1.25', category})]});
    runNow(container.getInstance({key: 'updateShopProfile'}).update(buildProfile()));
    runNow(container.getInstance({key: 'createOrderUseCase'}).createOrder({
      lines: [{barcode: '1001', name: 'Fideo', price, quantity: Quantity.from(1), weighted: false}],
      payment: Payment.card({total: price})
    }));
    expect(() => database.exec('DELETE FROM invoice')).to.throw();
    expect(database.prepare('SELECT number FROM invoice').get().number).to.equal(1);
  });
});
