import fs from 'fs';
import os from 'os';
import path from 'path';
import {expect} from 'chai';
import 'rxjs/add/operator/mergeMap';
import SqliteConnection from '../openMarket/infrastructure/service/SqliteConnection';
import SqliteOrderRepository from '../openMarket/infrastructure/order/SqliteOrderRepository';
import SqliteOrderQueryService from '../openMarket/infrastructure/order/SqliteOrderQueryService';
import SqlOrderMapper from '../openMarket/infrastructure/order/SqlOrderMapper';
import Order from '../openMarket/domain/order/Order';
import Money from '../openMarket/domain/money/Money';

describe('order takings', () => {
  let file;
  let connection;

  afterEach(() => {
    if (connection) {
      connection.database.close();
      connection = null;
    }
    if (file) {
      fs.rmSync(file, {force: true});
      file = null;
    }
  });

  it('sums each ticket once and every line, split by payment method', done => {
    file = path.join(os.tmpdir(), `om-takings-${Date.now()}-${process.pid}.sqlite`);
    connection = new SqliteConnection({filename: file});
    const repository = new SqliteOrderRepository({
      connection,
      objectMapper: new SqlOrderMapper(),
      queryService: new SqliteOrderQueryService()
    });
    const cash = Order.draft({id: 'cash', date: '04/11/2026 10:00:00'})
      .addLine({barcode: '0001', name: 'Ham', price: Money.ofCents(100), quantity: 1})
      .addLine({barcode: '0002', name: 'Bread', price: Money.ofCents(100), quantity: 2})
      .place()
      .recordPayment({method: 'cash', tenderedCents: 500});
    const card = Order.draft({id: 'card', date: '04/11/2026 11:00:00'})
      .addLine({barcode: '0001', name: 'Ham', price: Money.ofCents(200), quantity: 1})
      .place()
      .recordPayment({method: 'card'});
    const bizum = Order.draft({id: 'bizum', date: '05/11/2026 10:00:00'})
      .addLine({barcode: '0001', name: 'Ham', price: Money.ofCents(50), quantity: 1})
      .place()
      .recordPayment({method: 'bizum'});
    const mixed = Order.draft({id: 'mixed', date: '05/11/2026 12:00:00'})
      .addLine({barcode: '0003', name: 'Cheese', price: Money.ofCents(250), quantity: 1})
      .place()
      .recordPayment({
        method: 'mixed',
        parts: [
          {method: 'cash', amountCents: 100},
          {method: 'card', amountCents: 150}
        ]
      });
    const plain = Order.draft({id: 'plain', date: '05/11/2026 13:00:00'})
      .addLine({barcode: '0004', name: 'Olives', price: Money.ofCents(100), quantity: 0.5})
      .place();

    repository.save({order: cash})
      .mergeMap(() => repository.save({order: card}))
      .mergeMap(() => repository.save({order: bizum}))
      .mergeMap(() => repository.save({order: mixed}))
      .mergeMap(() => repository.save({order: plain}))
      .mergeMap(() => repository.takings({from: '2026-11-04 00:00:00', to: '2026-11-05 23:59:59'}))
      .subscribe(takings => {
        expect(takings.totalCents).to.equal(850);
        expect(takings.ticketCount).to.equal(5);
        expect(takings.averageCents).to.equal(170);
        expect(takings.units).to.equal(6.5);
        expect(takings.days).to.deep.equal([
          {soldOn: '2026-11-04', cashCents: 300, cardCents: 200, bizumCents: 0},
          {soldOn: '2026-11-05', cashCents: 150, cardCents: 150, bizumCents: 50}
        ]);
        done();
      }, done);
  });
});
