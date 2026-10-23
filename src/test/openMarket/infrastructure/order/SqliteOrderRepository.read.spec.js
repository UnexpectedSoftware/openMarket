import {expect} from 'chai';
import Order from '../../../../openMarket/domain/order/Order';
import OrderView from '../../../../openMarket/domain/order/OrderView';
import OrderDetail from '../../../../openMarket/domain/order/OrderDetail';
import OrdersQuery from '../../../../openMarket/domain/order/OrdersQuery';
import OrderRangeSummary from '../../../../openMarket/domain/order/OrderRangeSummary';
import ErrorCode from '../../../../openMarket/domain/error/ErrorCode';
import SqliteOrderRepository from '../../../../openMarket/infrastructure/order/SqliteOrderRepository';

describe('SqliteOrderRepository read model', () => {
  const from = '2026-10-21 00:00:00';
  const to = '2026-10-21 23:59:59';

  function database({rows, total, summary, fail, count}) {
    const calls = [];
    return {
      calls,
      prepare(sql) {
        if (fail) {
          throw new Error('db down');
        }
        return {
          all(...params) {
            calls.push({sql, params});
            return sql.indexOf('invoice_number') === -1 ? summary : rows;
          },
          get(...params) {
            calls.push({sql, params});
            return count === null ? null : {total};
          }
        };
      }
    };
  }

  function orders(db) {
    return new SqliteOrderRepository({
      connection: {database: db},
      objectMapper: {},
      queryService: {}
    });
  }

  it('maps stored rows, prefers cents, and pages with a separate count', done => {
    const db = database({
      total: 4,
      rows: [
        {
          order_id: 'new',
          created_at: '2026-10-21 10:00:01',
          total: 1,
          total_cents: 350,
          payment_method: 'card',
          invoice_number: '2026/000002',
          invoice_status: 'ISSUED',
          item_count: 2
        },
        {
          order_id: 'void',
          created_at: '2026-10-21T09:00:00',
          total: 1,
          total_cents: 100,
          payment_method: 'cash',
          invoice_status: 'CANCELLED',
          item_count: 1
        },
        {
          order_id: 'bare',
          created_at: '2026-10-21 08:00:00',
          total_cents: 50,
          payment_method: 'bizum',
          invoice_number: '',
          item_count: null
        },
        {
          order_id: 'legacy',
          created_at: '2026-10-21 07:00:00',
          total: 1.25,
          total_cents: null,
          payment_method: null,
          invoice_number: '2026/000004',
          invoice_status: 'ISSUED',
          item_count: 1
        }
      ],
      summary: []
    });
    orders(db).find(new OrdersQuery({from, to, limit: 500, offset: -4})).subscribe(
      page => {
        expect(page.total).to.equal(4);
        expect(page.items.map(item => item.orderId)).to.deep.equal(['new', 'void', 'bare', 'legacy']);
        expect(page.items[0]).to.be.instanceof(OrderView);
        expect(page.items[0]).to.not.be.instanceof(Order);
        expect(page.items[0].invoiceNumber).to.equal('2026/000002');
        expect(page.items[0].createdAt).to.equal('2026-10-21T10:00:01');
        expect(page.items[0].itemCount).to.equal(2);
        expect(page.items[0].paymentMethod).to.equal('card');
        expect(page.items[0].totalCents).to.equal(350);
        expect(page.items[0].cancelled).to.equal(false);
        expect(page.items[1].cancelled).to.equal(true);
        expect(page.items[1].paymentMethod).to.equal('cash');
        expect(page.items[1].invoiceNumber).to.equal('—');
        expect(page.items[2].invoiceNumber).to.equal('—');
        expect(page.items[2].paymentMethod).to.equal(null);
        expect(page.items[2].itemCount).to.equal(0);
        expect(page.items[3].totalCents).to.equal(125);
        const listed = db.calls.find(call => call.sql.indexOf('invoice_number') !== -1);
        expect(listed.params).to.deep.equal([from, to, 100, 0]);
      },
      error => done(error),
      () => done()
    );
  });

  it('builds the range summary from the cent total', done => {
    const db = database({
      total: 0,
      rows: [],
      summary: [{total_cents: 100, total: 1}, {total_cents: 101, total: 1}]
    });
    orders(db).summary({from, to}).subscribe(
      summary => {
        expect(summary).to.be.instanceof(OrderRangeSummary);
        expect(summary.totalCents).to.equal(201);
        expect(summary.ticketCount).to.equal(2);
        expect(summary.averageCents).to.equal(101);
      },
      error => done(error),
      () => done()
    );
  });

  it('returns a zero summary for an empty range', done => {
    const db = database({total: 0, rows: [], summary: []});
    orders(db).summary({from, to}).subscribe(
      summary => {
        expect(summary.totalCents).to.equal(0);
        expect(summary.ticketCount).to.equal(0);
        expect(summary.averageCents).to.equal(0);
      },
      error => done(error),
      () => done()
    );
  });

  it('uses the default page when the limit is missing', done => {
    const db = database({total: 0, rows: [], summary: []});
    orders(db).find(new OrdersQuery({from, to})).subscribe(
      page => {
        expect(page.items).to.deep.equal([]);
        expect(page.total).to.equal(0);
        const listed = db.calls.find(call => call.sql.indexOf('LIMIT') !== -1);
        expect(listed.params[2]).to.equal(20);
        expect(listed.params[3]).to.equal(0);
      },
      error => done(error),
      () => done()
    );
  });

  it('lets a driver failure reach the caller', done => {
    const db = database({fail: true, rows: [], summary: [], total: 0});
    orders(db).find(new OrdersQuery({from, to})).subscribe(
      () => done(new Error('should fail')),
      error => {
        expect(error.message).to.equal('db down');
        orders(db).summary({from, to}).subscribe(
          () => done(new Error('should fail')),
          summaryError => {
            expect(summaryError.message).to.equal('db down');
            done();
          }
        );
      }
    );
  });

  it('treats a missing count row as zero', done => {
    const db = database({total: 0, rows: [], summary: [], count: null});
    orders(db).find(new OrdersQuery({from, to, limit: 1, offset: 3})).subscribe(
      page => expect(page.total).to.equal(0),
      error => done(error),
      () => done()
    );
  });
});

describe('SqliteOrderRepository order detail', () => {
  function detailDb({row, lines, vat, fail}) {
    return {
      prepare(sql) {
        if (fail) {
          throw new Error('db down');
        }
        return {
          get() {
            return sql.indexOf('invoice_id') !== -1 && sql.indexOf('FROM "order"') !== -1 ? row : undefined;
          },
          all() {
            if (sql.indexOf('invoice_vat') !== -1) {
              return vat || [];
            }
            if (sql.indexOf('invoice_line') !== -1) {
              return lines || [];
            }
            return [];
          }
        };
      }
    };
  }

  function read(db) {
    return new SqliteOrderRepository({connection: {database: db}, objectMapper: {}, queryService: {}});
  }

  const header = {
    order_id: 'sale-1',
    created_at: '2026-10-21 10:00:00',
    total: 1,
    total_cents: 1,
    payment_method: 'cash',
    tendered_cents: 2000,
    change_cents: 687,
    invoice_id: 'inv-1',
    invoice_number: '2026/000042',
    invoice_type: 'F2',
    invoice_status: 'ISSUED',
    invoice_total: 13.13,
    invoice_total_cents: 1313
  };

  it('maps invoice lines, VAT, and the invoice total', done => {
    const db = detailDb({
      row: header,
      lines: [
        {
          barcode: 'ham',
          name: 'Ham',
          price: 18.5,
          quantity: 0.35,
          amount: 6.48,
          price_cents: 1850,
          quantity_milli: 350,
          amount_cents: 648,
          vat_percent: 10,
          vat_kind: 'S1',
          vat_cause: null,
          kind: 'PRODUCT',
          weighted: 1
        },
        {
          barcode: '',
          name: 'Bolsa',
          price: 0.5,
          quantity: 1,
          amount: 0.5,
          price_cents: 50,
          quantity_milli: 1000,
          amount_cents: 50,
          vat_percent: 21,
          vat_kind: 'S1',
          vat_cause: '',
          kind: 'FREE',
          weighted: 1
        },
        {
          barcode: 'milk',
          name: 'Milk',
          price: 1,
          quantity: 1,
          amount: 1,
          price_cents: null,
          quantity_milli: null,
          amount_cents: null,
          vat_percent: null,
          vat_kind: '',
          vat_cause: null,
          kind: 'PRODUCT',
          weighted: 0
        }
      ],
      vat: [
        {kind: 'S1', percent: 10, cause: null, base_cents: 589, quota_cents: 59},
        {kind: 'E', percent: 0, cause: '', base_cents: 50, quota_cents: 0}
      ]
    });
    read(db).find({id: 'sale-1'}).subscribe(
      detail => {
        expect(detail).to.be.instanceof(OrderDetail);
        expect(detail).to.not.be.instanceof(Order);
        expect(Object.isFrozen(detail)).to.equal(true);
        expect(Object.isFrozen(detail.lines)).to.equal(true);
        expect(Object.isFrozen(detail.lines[0])).to.equal(true);
        expect(detail.invoiceNumber).to.equal('2026/000042');
        expect(detail.invoiceType).to.equal('F2');
        expect(detail.cancelled).to.equal(false);
        expect(detail.createdAt).to.equal('2026-10-21T10:00:00');
        expect(detail.totalCents).to.equal(1313);
        expect(detail.payment).to.deep.equal({method: 'cash', tenderedCents: 2000, changeCents: 687});
        expect(detail.lines.map(line => line.weighted)).to.deep.equal([true, false, false]);
        expect(detail.lines[0].quantityMilli).to.equal(350);
        expect(detail.lines[0].amountCents).to.equal(648);
        expect(detail.lines[0].vat).to.deep.equal({kind: 'S1', percent: 10, cause: null});
        expect(detail.lines[1].kind).to.equal('FREE');
        expect(detail.lines[2].unitPriceCents).to.equal(100);
        expect(detail.lines[2].quantityMilli).to.equal(1000);
        expect(detail.lines[2].vat.kind).to.equal('S1');
        expect(detail.lines[2].vat.percent).to.equal(21);
        expect(detail.vat[0].baseCents).to.equal(589);
        expect(detail.vat[1].cause).to.equal(null);
        expect(detail.vat[1].kind).to.equal('E');
      },
      error => done(error),
      () => done()
    );
  });

  it('flags a cancelled invoice and a whole weighed unit', done => {
    const db = detailDb({
      row: {...header, invoice_status: 'CANCELLED', payment_method: 'card', tendered_cents: null, change_cents: ''},
      lines: [{
        barcode: 'cheese',
        name: 'Cheese',
        price_cents: 1000,
        quantity_milli: 1000,
        amount_cents: 1000,
        vat_percent: 21,
        vat_kind: 'S1',
        vat_cause: null,
        kind: 'PRODUCT',
        weighted: 1
      }],
      vat: []
    });
    read(db).find({id: 'sale-1'}).subscribe(
      detail => {
        expect(detail.cancelled).to.equal(true);
        expect(detail.payment).to.deep.equal({method: 'card', tenderedCents: null, changeCents: null});
        expect(detail.lines[0].weighted).to.equal(true);
        expect(detail.lines[0].quantityMilli).to.equal(1000);
      },
      error => done(error),
      () => done()
    );
  });

  it('returns null for an unknown id and a dash when the invoice is missing', done => {
    const missing = detailDb({row: undefined});
    const bare = detailDb({
      row: {
        order_id: 'bare',
        created_at: '2026-10-21 08:00:00',
        total: 0.5,
        total_cents: 50,
        payment_method: null,
        tendered_cents: null,
        change_cents: null,
        invoice_id: null,
        invoice_number: null
      }
    });
    read(missing).find({id: 'nope'}).subscribe(
      detail => {
        expect(detail).to.equal(null);
        read(bare).find({id: 'bare'}).subscribe(
          found => {
            expect(found).to.be.instanceof(OrderDetail);
            expect(found).to.not.be.instanceof(Order);
            expect(found.invoiceNumber).to.equal('—');
            expect(found.invoiceType).to.equal(null);
            expect(found.lines).to.deep.equal([]);
            expect(found.vat).to.deep.equal([]);
            expect(found.totalCents).to.equal(50);
            expect(found.payment).to.equal(null);
            read(missing).find({id: ''}).subscribe(
              empty => {
                expect(empty).to.equal(null);
                read(missing).find(null).subscribe(
                  nothing => expect(nothing).to.equal(null),
                  error => done(error),
                  () => done()
                );
              },
              error => done(error)
            );
          },
          error => done(error)
        );
      },
      error => done(error)
    );
  });

  it('reports a driver failure while reading one order', done => {
    read(detailDb({fail: true})).find({id: 'a'}).subscribe(
      () => done(new Error('should fail')),
      error => {
        expect(error.code).to.equal(ErrorCode.UNEXPECTED);
        expect(error.message).to.contain('Could not read the order');
        done();
      }
    );
  });
});
