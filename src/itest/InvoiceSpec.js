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

function count(sql) {
  return Number(database.prepare(sql).get().total);
}

function storedInvoice(id) {
  return database.prepare(
    'SELECT series, number, invoice_number AS invoiceNumber, issued_at AS issuedAt, ' +
    'order_id AS orderId, status, cancelled_at AS cancelledAt, total FROM invoice WHERE id = ?'
  ).get(id);
}

describe('Invoice', () => {
  beforeEach(() => {
    replaceSqliteData(database, {products: [product]});
  });

  afterEach(() => {
    replaceSqliteData(database, {});
  });

  it('gives each invoice the next number in its series', done => {
    issueInvoice.issueInvoice({lines, series: 'A', issuedAt: '2026-10-14T12:00:00.000Z'})
      .flatMap(first => issueInvoice.issueInvoice({
        lines,
        series: 'A',
        issuedAt: '2026-10-14T12:00:00.000Z'
      }).map(second => ({first, second})))
      .flatMap(({first, second}) => issueInvoice.issueInvoice({
        lines,
        series: 'B',
        issuedAt: '2026-10-14T12:00:00.000Z'
      }).map(third => ({first, second, third})))
      .subscribe(
        ({first, second, third}) => {
          expect(first.invoiceNumber.formatted).to.equal('A/000001');
          expect(second.invoiceNumber.formatted).to.equal('A/000002');
          expect(third.invoiceNumber.formatted).to.equal('B/000001');
          expect(count('SELECT COUNT(*) AS total FROM invoice')).to.equal(3);
          const row = database.prepare(
            'SELECT type, payload, aggregate_id AS aggregateId, dispatched_at AS dispatchedAt ' +
            'FROM domain_event WHERE type = ? AND aggregate_id = ?'
          ).get('InvoiceIssued', first.id);
          expect(row.aggregateId).to.equal(first.id);
          expect(row.dispatchedAt).to.match(/^\d{4}-\d{2}-\d{2}T/);
          const payload = JSON.parse(row.payload);
          expect(payload.invoiceNumber).to.equal('A/000001');
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
    issueInvoice.issueInvoice({lines, issuedAt: '2026-03-01T00:00:00.000Z'}).subscribe(
      invoice => {
        expect(invoice.invoiceNumber.formatted).to.equal('2026/000001');
        expect(invoice.issuedAt).to.equal('2026-03-01T00:00:00.000Z');
      },
      error => done(error),
      () => done()
    );
  });

  it('keeps the formatted number unique', done => {
    issueInvoice.issueInvoice({lines, series: 'A', issuedAt: '2026-10-14T12:00:00.000Z'}).subscribe(
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

  it('does not consume a number when the lines are rejected', done => {
    issueInvoice.issueInvoice({
      lines: [{barcode: '0001', name: 'Coca-Cola', price: 0.55, quantity: 0}],
      series: 'A'
    }).subscribe(
      () => done(new Error('should fail')),
      error => {
        expect(error.code).to.equal(ErrorCode.INVOICE_LINE_INVALID);
        expect(count('SELECT COUNT(*) AS total FROM invoice')).to.equal(0);
        issueInvoice.issueInvoice({lines, series: 'A', issuedAt: '2026-10-14T12:00:00.000Z'}).subscribe(
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
    const stop = domainEventBus.subscribeSync(InvoiceIssued, () => {
      throw new Error('sync failed');
    });
    issueInvoice.issueInvoice({lines, series: 'A', issuedAt: '2026-10-14T12:00:00.000Z'}).subscribe(
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
        issueInvoice.issueInvoice({lines, series: 'A', issuedAt: '2026-10-14T12:00:00.000Z'}).subscribe(
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
  });

  it('stores the lines once and does not rewrite them', done => {
    issueInvoice.issueInvoice({lines, series: 'A', issuedAt: '2026-10-14T12:00:00.000Z'})
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
    issueInvoice.issueInvoice({lines, series: 'A', issuedAt: '2026-10-14T12:00:00.000Z'})
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
        },
        error => done(error),
        () => done()
      );
  });

  it('issues an invoice for an order without changing the order or the stock again', done => {
    const sold = [{barcode: '0001', name: 'Coca-Cola', price: 0.55, quantity: 1}];
    createOrder.createOrder({lines: sold})
      .flatMap(order => issueInvoice.issueInvoice({orderId: order.id, series: 'A'}).map(invoice => ({order, invoice})))
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
    createOrder.createOrder({lines: [{barcode: '0001', name: 'Coca-Cola', price: 0.55, quantity: 1}]})
      .subscribe(
        order => {
          expect(order.id).to.be.a('string');
          expect(count('SELECT COUNT(*) AS total FROM invoice')).to.equal(0);
        },
        error => done(error),
        () => done()
      );
  });
});
