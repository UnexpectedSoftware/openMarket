import {expect} from 'chai';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/mergeMap';
import openMarket from '../openMarket/application/index';
import container from '../openMarket/infrastructure/dic/Container';
import {replaceSqliteData} from '../openMarket/infrastructure/service/sqliteSeed';
import InvoiceIssued from '../openMarket/domain/event/InvoiceIssued';
import ErrorCode from '../openMarket/domain/error/ErrorCode';

const database = container.getInstance({key: 'sqliteConnection'}).database;
const issueInvoice = openMarket.get('invoices_issue_use_case');
const cancelInvoice = openMarket.get('invoices_cancel_use_case');
const createOrder = openMarket.get('orders_create_use_case');
const invoiceRepository = container.getInstance({key: 'invoiceRepository'});
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

const lines = [{barcode: '0001', name: 'Coca-Cola', price: 0.55, quantity: 2}];
const issuedAt = '2026-10-14T12:00:00.000Z';

function count(sql) {
  return Number(database.prepare(sql).get().total);
}

function storedInvoice(id) {
  return database.prepare(
    'SELECT series, number, invoice_number AS invoiceNumber, issued_at AS issuedAt, ' +
    'order_id AS orderId, status, cancelled_at AS cancelledAt, total FROM invoice WHERE id = ?'
  ).get(id);
}

function placeOrder(orderLines = lines) {
  return createOrder.createOrder({lines: orderLines});
}

function issue(order, command = {}) {
  return issueInvoice.issueInvoice({
    orderId: order.id,
    series: 'A',
    issuedAt,
    ...command
  });
}

describe('Invoice', () => {
  beforeEach(() => {
    replaceSqliteData(database, {products: [product]});
  });

  afterEach(() => {
    replaceSqliteData(database, {});
  });

  it('gives each invoice the next number in its series', done => {
    placeOrder()
      .flatMap(order => issue(order)
        .flatMap(first => issue(order).map(second => ({order, first, second})))
        .flatMap(({order, first, second}) => issue(order, {series: 'B'}).map(third => ({order, first, second, third}))))
      .subscribe(
        ({order, first, second, third}) => {
          expect(first.invoiceNumber.formatted).to.equal('A/000001');
          expect(second.invoiceNumber.formatted).to.equal('A/000002');
          expect(third.invoiceNumber.formatted).to.equal('B/000001');
          expect(first.orderId).to.equal(order.id);
          expect(second.orderId).to.equal(order.id);
          expect(third.orderId).to.equal(order.id);
          expect(count('SELECT COUNT(*) AS total FROM invoice')).to.equal(3);
          const row = database.prepare(
            'SELECT type, payload, aggregate_id AS aggregateId, dispatched_at AS dispatchedAt ' +
            'FROM domain_event WHERE type = ? AND aggregate_id = ?'
          ).get('InvoiceIssued', first.id);
          expect(row.aggregateId).to.equal(first.id);
          expect(row.dispatchedAt).to.match(/^\d{4}-\d{2}-\d{2}T/);
          const payload = JSON.parse(row.payload);
          expect(payload.invoiceNumber).to.equal('A/000001');
          expect(payload.orderId).to.equal(order.id);
          expect(payload.total).to.equal(1.1);
          expect(payload.lines[0]).to.deep.equal({
            barcode: '0001',
            name: 'Coca-Cola',
            price: 0.55,
            quantity: 2,
            amount: 1.1
          });
        },
        error => done(error),
        () => done()
      );
  });

  it('uses the year of the issue time as the series', done => {
    placeOrder()
      .flatMap(order => issue(order, {series: undefined, issuedAt: '2026-03-01T00:00:00.000Z'}))
      .subscribe(
        invoice => {
          expect(invoice.invoiceNumber.formatted).to.equal('2026/000001');
          expect(invoice.issuedAt).to.equal('2026-03-01T00:00:00.000Z');
        },
        error => done(error),
        () => done()
      );
  });

  it('keeps the formatted number unique', done => {
    placeOrder()
      .flatMap(order => issue(order))
      .subscribe(
        () => {
          expect(() => database.prepare(
            'INSERT INTO invoice (id, series, number, invoice_number, issued_at, order_id, status, cancelled_at, total) ' +
            'VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
          ).run(
            'other',
            'A',
            1,
            'A/000001',
            '2026-10-14T12:00:00.000Z',
            null,
            'ISSUED',
            null,
            1.1
          )).to.throw(/UNIQUE/);
          done();
        },
        error => done(error)
      );
  });

  it('does not consume a number when the order cannot be placed', done => {
    placeOrder([{barcode: '0001', name: 'Coca-Cola', price: 0.55, quantity: 0}]).subscribe(
      () => done(new Error('should fail')),
      error => {
        expect(error.code).to.equal(ErrorCode.ORDER_QUANTITY_INVALID);
        expect(count('SELECT COUNT(*) AS total FROM invoice')).to.equal(0);
        expect(count('SELECT COUNT(*) AS total FROM invoice_sequence')).to.equal(0);
        expect(count('SELECT COUNT(*) AS total FROM "order"')).to.equal(0);
        placeOrder()
          .flatMap(order => issue(order))
          .subscribe(
            invoice => {
              expect(invoice.invoiceNumber.formatted).to.equal('A/000001');
              expect(count('SELECT COUNT(*) AS total FROM invoice_sequence WHERE series = \'A\'')).to.equal(1);
            },
            next => done(next),
            () => done()
          );
      }
    );
  });

  it('gives the number back when a synchronous subscriber throws', done => {
    const seen = [];
    const subscription = domainEventBus.ofType(InvoiceIssued).subscribe(event => seen.push(event));
    placeOrder().subscribe(
      order => {
        const stop = domainEventBus.subscribeSync(InvoiceIssued, () => {
          throw new Error('sync failed');
        });
        issue(order).subscribe(
          () => {
            stop();
            subscription.unsubscribe();
            done(new Error('should fail'));
          },
          error => {
            stop();
            expect(error.message).to.equal('sync failed');
            expect(seen).to.have.lengthOf(0);
            expect(count('SELECT COUNT(*) AS total FROM invoice')).to.equal(0);
            expect(count('SELECT COUNT(*) AS total FROM invoice_line')).to.equal(0);
            expect(count('SELECT COUNT(*) AS total FROM invoice_sequence')).to.equal(0);
            expect(count('SELECT COUNT(*) AS total FROM domain_event WHERE type = \'InvoiceIssued\'')).to.equal(0);
            issue(order).subscribe(
              invoice => {
                subscription.unsubscribe();
                expect(invoice.invoiceNumber.formatted).to.equal('A/000001');
                expect(seen).to.have.lengthOf(1);
              },
              next => {
                subscription.unsubscribe();
                done(next);
              },
              () => done()
            );
          }
        );
      },
      error => {
        subscription.unsubscribe();
        done(error);
      }
    );
  });

  it('stores the lines once and does not rewrite them', done => {
    placeOrder()
      .flatMap(order => issue(order))
      .flatMap(invoice => invoiceRepository.save({invoice}).map(() => invoice))
      .flatMap(invoice => invoiceRepository.findByNumber({invoiceNumber: 'A/000001'}).map(found => ({invoice, found})))
      .subscribe(
        ({invoice, found}) => {
          expect(count('SELECT COUNT(*) AS total FROM invoice_line')).to.equal(lines.length);
          expect(found.id).to.equal(invoice.id);
          expect(found.invoiceNumber.formatted).to.equal('A/000001');
          expect(found.lines).to.deep.equal(invoice.lines);
          expect(found.total).to.equal(1.1);
          expect(found.status).to.equal('ISSUED');
        },
        error => done(error),
        () => done()
      );
  });

  it('cancels without changing the issued number, lines, or total', done => {
    placeOrder()
      .flatMap(order => issue(order))
      .flatMap(invoice => {
        const before = storedInvoice(invoice.id);
        return cancelInvoice.cancelInvoice({
          id: invoice.id,
          cancelledAt: '2026-10-14T15:00:00.000Z'
        }).map(cancelled => ({before, cancelled}));
      })
      .flatMap(({before, cancelled}) => invoiceRepository.findById({id: cancelled.id})
        .map(found => ({before, cancelled, found})))
      .subscribe(
        ({before, cancelled, found}) => {
          const after = storedInvoice(cancelled.id);
          expect(after.invoiceNumber).to.equal(before.invoiceNumber);
          expect(after.issuedAt).to.equal(before.issuedAt);
          expect(after.total).to.equal(before.total);
          expect(after.series).to.equal(before.series);
          expect(after.number).to.equal(before.number);
          expect(after.orderId).to.equal(before.orderId);
          expect(after.status).to.equal('CANCELLED');
          expect(after.cancelledAt).to.equal('2026-10-14T15:00:00.000Z');
          expect(found.lines).to.deep.equal(cancelled.lines);
          expect(found.invoiceNumber.formatted).to.equal('A/000001');
          expect(count('SELECT COUNT(*) AS total FROM invoice_line')).to.equal(lines.length);
          const event = database.prepare(
            'SELECT payload FROM domain_event WHERE type = ? AND aggregate_id = ?'
          ).get('InvoiceCancelled', cancelled.id);
          expect(JSON.parse(event.payload).cancelledAt).to.equal('2026-10-14T15:00:00.000Z');
          expect(JSON.parse(event.payload).invoiceNumber).to.equal('A/000001');
          expect(JSON.parse(event.payload).orderId).to.equal(before.orderId);
        },
        error => done(error),
        () => done()
      );
  });

  it('issues an invoice for an order without changing the order or the stock again', done => {
    const sold = [{barcode: '0001', name: 'Coca-Cola', price: 0.55, quantity: 1}];
    placeOrder(sold)
      .flatMap(order => issue(order).map(invoice => ({order, invoice})))
      .subscribe(
        ({order, invoice}) => {
          expect(invoice.orderId).to.equal(order.id);
          expect(invoice.lines).to.deep.equal([
            {barcode: '0001', name: 'Coca-Cola', price: 0.55, quantity: 1, amount: 0.55}
          ]);
          const stock = database.prepare('SELECT stock FROM product WHERE barcode = ?').get('0001');
          expect(stock.stock).to.equal(99);
          const storedOrder = database.prepare('SELECT id FROM "order" WHERE id = ?').get(order.id);
          expect(storedOrder.id).to.equal(order.id);
        },
        error => done(error),
        () => done()
      );
  });

  it('leaves an order without an invoice', done => {
    placeOrder([{barcode: '0001', name: 'Coca-Cola', price: 0.55, quantity: 1}])
      .subscribe(
        order => {
          expect(order.id).to.be.a('string');
          expect(order.isPlaced()).to.equal(true);
          expect(count('SELECT COUNT(*) AS total FROM invoice')).to.equal(0);
        },
        error => done(error),
        () => done()
      );
  });
});
