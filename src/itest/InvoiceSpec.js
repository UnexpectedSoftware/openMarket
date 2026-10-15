import {expect} from 'chai';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/mergeMap';
import openMarket from '../openMarket/application/index';
import container from '../openMarket/infrastructure/dic/Container';
import {replaceSqliteData} from '../openMarket/infrastructure/service/sqliteSeed';
import InvoiceIssued from '../openMarket/domain/event/InvoiceIssued';
import Invoice from '../openMarket/domain/invoice/Invoice';
import InvoiceNumber from '../openMarket/domain/invoice/InvoiceNumber';
import ErrorCode from '../openMarket/domain/error/ErrorCode';
import SystemClock from '../openMarket/infrastructure/service/SystemClock';

const database = container.getInstance({key: 'sqliteConnection'}).database;
const cancelInvoice = openMarket.get('invoices_cancel_use_case');
const createOrder = openMarket.get('orders_create_use_case');
const invoiceRepository = container.getInstance({key: 'invoiceRepository'});
const transaction = container.getInstance({key: 'transaction'});
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

function count(sql) {
  return Number(database.prepare(sql).get().total);
}

function invoiceFor(orderId) {
  return database.prepare(
    'SELECT id, series, number, invoice_number AS invoiceNumber, issued_at AS issuedAt, ' +
    'order_id AS orderId, status, cancelled_at AS cancelledAt, total FROM invoice WHERE order_id = ?'
  ).get(orderId);
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

function stock() {
  return database.prepare('SELECT stock FROM product WHERE barcode = ?').get('0001').stock;
}

describe('Invoice', () => {
  beforeEach(() => {
    replaceSqliteData(database, {products: [product]});
  });

  afterEach(() => {
    replaceSqliteData(database, {});
  });

  it('stores the next invoice with each order', done => {
    placeOrder()
      .flatMap(firstOrder => placeOrder().map(secondOrder => ({firstOrder, secondOrder})))
      .subscribe(
        ({firstOrder, secondOrder}) => {
          const first = invoiceFor(firstOrder.id);
          const second = invoiceFor(secondOrder.id);
          const year = new SystemClock().localDate({instant: first.issuedAt}).slice(0, 4);
          expect(first.invoiceNumber).to.equal(year + '/000001');
          expect(second.invoiceNumber).to.equal(year + '/000002');
          expect(first.series).to.equal(year);
          expect(second.series).to.equal(year);
          expect(first.orderId).to.equal(firstOrder.id);
          expect(second.orderId).to.equal(secondOrder.id);
          expect(count('SELECT COUNT(*) AS total FROM invoice')).to.equal(2);
          expect(count('SELECT COUNT(*) AS total FROM "order"')).to.equal(2);
          const row = database.prepare(
            'SELECT type, payload, aggregate_id AS aggregateId, dispatched_at AS dispatchedAt ' +
            'FROM domain_event WHERE type = ? AND aggregate_id = ?'
          ).get('InvoiceIssued', first.id);
          expect(row.aggregateId).to.equal(first.id);
          expect(row.dispatchedAt).to.match(/^\d{4}-\d{2}-\d{2}T/);
          const payload = JSON.parse(row.payload);
          expect(payload.invoiceNumber).to.equal(first.invoiceNumber);
          expect(payload.orderId).to.equal(firstOrder.id);
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

  it('keeps the formatted number unique', done => {
    placeOrder().subscribe(
      order => {
        const invoice = invoiceFor(order.id);
        expect(() => database.prepare(
          'INSERT INTO invoice (id, series, number, invoice_number, issued_at, order_id, status, cancelled_at, total) ' +
          'VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
        ).run(
          'other',
          invoice.series,
          invoice.number,
          invoice.invoiceNumber,
          invoice.issuedAt,
          null,
          'ISSUED',
          null,
          invoice.total
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
        expect(stock()).to.equal(100);
        placeOrder().subscribe(
          order => {
            const invoice = invoiceFor(order.id);
            expect(invoice.invoiceNumber).to.match(/\/000001$/);
            expect(count('SELECT COUNT(*) AS total FROM invoice_sequence')).to.equal(1);
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
    const stop = domainEventBus.subscribeSync(InvoiceIssued, () => {
      throw new Error('sync failed');
    });
    placeOrder().subscribe(
      () => {
        stop();
        subscription.unsubscribe();
        done(new Error('should fail'));
      },
      error => {
        stop();
        expect(error.message).to.equal('sync failed');
        expect(seen).to.have.lengthOf(0);
        expect(count('SELECT COUNT(*) AS total FROM "order"')).to.equal(0);
        expect(count('SELECT COUNT(*) AS total FROM line')).to.equal(0);
        expect(count('SELECT COUNT(*) AS total FROM invoice')).to.equal(0);
        expect(count('SELECT COUNT(*) AS total FROM invoice_line')).to.equal(0);
        expect(count('SELECT COUNT(*) AS total FROM invoice_sequence')).to.equal(0);
        expect(count('SELECT COUNT(*) AS total FROM domain_event')).to.equal(0);
        expect(stock()).to.equal(100);
        placeOrder().subscribe(
          order => {
            subscription.unsubscribe();
            const invoice = invoiceFor(order.id);
            expect(invoice.invoiceNumber).to.match(/\/000001$/);
            expect(invoice.orderId).to.equal(order.id);
            expect(seen).to.have.lengthOf(1);
            expect(stock()).to.equal(98);
          },
          next => {
            subscription.unsubscribe();
            done(next);
          },
          () => done()
        );
      }
    );
  });

  it('stores the lines once and does not rewrite them', done => {
    placeOrder()
      .flatMap(order => {
        const row = invoiceFor(order.id);
        return invoiceRepository.findByNumber({invoiceNumber: row.invoiceNumber});
      })
      .flatMap(invoice => invoiceRepository.save({invoice}).map(() => invoice))
      .flatMap(invoice => invoiceRepository.findByNumber({invoiceNumber: invoice.invoiceNumber.formatted})
        .map(found => ({invoice, found})))
      .subscribe(
        ({invoice, found}) => {
          expect(count('SELECT COUNT(*) AS total FROM invoice_line')).to.equal(lines.length);
          expect(found.id).to.equal(invoice.id);
          expect(found.invoiceNumber.formatted).to.equal(invoice.invoiceNumber.formatted);
          expect(found.lines).to.deep.equal(invoice.lines);
          expect(found.total).to.equal(1.1);
          expect(found.status).to.equal('ISSUED');
          expect(found.orderId).to.equal(invoice.orderId);
        },
        error => done(error),
        () => done()
      );
  });

  it('cancels without changing the issued number, lines, or total', done => {
    placeOrder()
      .flatMap(order => {
        const row = invoiceFor(order.id);
        const before = storedInvoice(row.id);
        return cancelInvoice.cancelInvoice({
          id: row.id,
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
          expect(found.invoiceNumber.formatted).to.equal(before.invoiceNumber);
          expect(count('SELECT COUNT(*) AS total FROM invoice_line')).to.equal(lines.length);
          expect(count('SELECT COUNT(*) AS total FROM "order"')).to.equal(1);
          const event = database.prepare(
            'SELECT payload FROM domain_event WHERE type = ? AND aggregate_id = ?'
          ).get('InvoiceCancelled', cancelled.id);
          expect(JSON.parse(event.payload).cancelledAt).to.equal('2026-10-14T15:00:00.000Z');
          expect(JSON.parse(event.payload).invoiceNumber).to.equal(before.invoiceNumber);
          expect(JSON.parse(event.payload).orderId).to.equal(before.orderId);
        },
        error => done(error),
        () => done()
      );
  });

  it('rejects a second invoice for the same order and rolls the transaction back', done => {
    placeOrder().subscribe(
      order => {
        const first = invoiceFor(order.id);
        const stockBefore = stock();
        transaction.run(() => {
          database.prepare('UPDATE product SET stock = 0 WHERE barcode = ?').run('0001');
          const second = Invoice.issue({
            id: 'second-invoice',
            invoiceNumber: new InvoiceNumber({
              series: first.series,
              number: Number(first.number) + 1
            }),
            issuedAt: first.issuedAt,
            order
          });
          return invoiceRepository.save({invoice: second});
        }).subscribe(
          () => done(new Error('should fail')),
          error => {
            expect(error.message).to.match(/UNIQUE/);
            expect(count('SELECT COUNT(*) AS total FROM invoice')).to.equal(1);
            expect(count('SELECT COUNT(*) AS total FROM invoice_line')).to.equal(lines.length);
            expect(invoiceFor(order.id).id).to.equal(first.id);
            expect(stock()).to.equal(stockBefore);
            done();
          }
        );
      },
      error => done(error)
    );
  });

  it('keeps the issued amounts when the product price changes', done => {
    placeOrder()
      .flatMap(order => {
        const row = invoiceFor(order.id);
        const storedLine = database.prepare(
          'SELECT price, quantity, amount FROM invoice_line WHERE invoice_id = ?'
        ).get(row.id);
        expect(row.total).to.equal(order.total);
        expect(storedLine.amount).to.equal(1.1);
        database.prepare('UPDATE product SET price = ? WHERE barcode = ?').run(99, '0001');
        return invoiceRepository.findById({id: row.id}).map(invoice => ({order, invoice, storedLine}));
      })
      .subscribe(
        ({order, invoice, storedLine}) => {
          expect(invoice.total).to.equal(order.total);
          expect(invoice.lines).to.deep.equal([{
            barcode: '0001',
            name: 'Coca-Cola',
            price: storedLine.price,
            quantity: storedLine.quantity,
            amount: storedLine.amount
          }]);
          expect(database.prepare('SELECT price FROM product WHERE barcode = ?').get('0001').price).to.equal(99);
        },
        error => done(error),
        () => done()
      );
  });

  it('reduces stock once when the order and the invoice are stored', done => {
    const sold = [{barcode: '0001', name: 'Coca-Cola', price: 0.55, quantity: 1}];
    placeOrder(sold).subscribe(
      order => {
        const invoice = invoiceFor(order.id);
        expect(invoice.orderId).to.equal(order.id);
        expect(invoice.status).to.equal('ISSUED');
        expect(stock()).to.equal(99);
        expect(count('SELECT COUNT(*) AS total FROM invoice')).to.equal(1);
        expect(count('SELECT COUNT(*) AS total FROM invoice_line')).to.equal(1);
      },
      error => done(error),
      () => done()
    );
  });
});
