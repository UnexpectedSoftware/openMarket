import {expect} from 'chai';
import Order from '../../../../openMarket/domain/order/Order';
import ErrorCode from '../../../../openMarket/domain/error/ErrorCode';
import SqliteOrdersQuery from '../../../../openMarket/infrastructure/order/SqliteOrdersQuery';

describe('SqliteOrdersQuery', () => {
  const from = '2026-10-21 00:00:00';
  const to = '2026-10-21 23:59:59';

  function database({rows, total, summary, fail}) {
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
            return {total};
          }
        };
      }
    };
  }

  it('maps plain rows, prefers cents, and pages with a separate count', done => {
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
    const query = new SqliteOrdersQuery({connection: {database: db}});
    query.list({from, to, limit: 500, offset: -4}).subscribe(
      page => {
        expect(page.total).to.equal(4);
        expect(page.items.map(item => item.orderId)).to.deep.equal(['new', 'void', 'bare', 'legacy']);
        expect(page.items[0]).to.deep.equal({
          orderId: 'new',
          invoiceNumber: '2026/000002',
          createdAt: '2026-10-21T10:00:01',
          itemCount: 2,
          paymentMethod: 'card',
          totalCents: 350,
          cancelled: false
        });
        expect(page.items[0]).to.not.be.instanceof(Order);
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

  it('rounds the average ticket from the cent total and is zero when empty', done => {
    const db = database({
      total: 0,
      rows: [],
      summary: [{total_cents: 100, total: 1}, {total_cents: 101, total: 1}]
    });
    const query = new SqliteOrdersQuery({connection: {database: db}});
    query.daySummary({from, to}).subscribe(
      summary => {
        expect(summary).to.deep.equal({totalCents: 201, ticketCount: 2, averageCents: 101});
      },
      error => done(error),
      () => done()
    );
  });

  it('returns a zero summary for an empty range', done => {
    const db = database({total: 0, rows: [], summary: []});
    const query = new SqliteOrdersQuery({connection: {database: db}});
    query.daySummary({from, to}).subscribe(
      summary => {
        expect(summary).to.deep.equal({totalCents: 0, ticketCount: 0, averageCents: 0});
      },
      error => done(error),
      () => done()
    );
  });

  it('uses the default page when the limit is missing', done => {
    const db = database({total: 0, rows: [], summary: []});
    const query = new SqliteOrdersQuery({connection: {database: db}});
    query.list({from, to}).subscribe(
      page => {
        expect(page).to.deep.equal({items: [], total: 0});
        const listed = db.calls.find(call => call.sql.indexOf('LIMIT') !== -1);
        expect(listed.params[2]).to.equal(20);
        expect(listed.params[3]).to.equal(0);
      },
      error => done(error),
      () => done()
    );
  });

  it('fails the list when the driver throws', done => {
    const query = new SqliteOrdersQuery({connection: {database: database({fail: true, rows: [], summary: [], total: 0})}});
    query.list({from, to}).subscribe(
      () => done(new Error('should fail')),
      error => {
        expect(error.code).to.equal(ErrorCode.UNEXPECTED);
        expect(error.message).to.contain('Could not list orders');
        done();
      }
    );
  });

  it('fails the summary when the driver throws', done => {
    const query = new SqliteOrdersQuery({connection: {database: database({fail: true, rows: [], summary: [], total: 0})}});
    query.daySummary({from, to}).subscribe(
      () => done(new Error('should fail')),
      error => {
        expect(error.message).to.contain('Could not summarize orders');
        done();
      }
    );
  });

  it('treats a missing count row as zero', done => {
    const db = {
      prepare(sql) {
        return {
          all: () => [],
          get: () => null
        };
      }
    };
    const query = new SqliteOrdersQuery({connection: {database: db}});
    query.list({from, to, limit: 1, offset: 3}).subscribe(
      page => expect(page.total).to.equal(0),
      error => done(error),
      () => done()
    );
  });
});
