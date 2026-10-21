import fs from 'fs';
import os from 'os';
import path from 'path';
import moment from 'moment';
import 'rxjs/add/operator/mergeMap';
import 'rxjs/add/operator/map';
import {expect} from 'chai';
import SqliteConnection from '../openMarket/infrastructure/service/SqliteConnection';
import SqliteOrdersQuery from '../openMarket/infrastructure/order/SqliteOrdersQuery';
import SqliteOrderRepository from '../openMarket/infrastructure/order/SqliteOrderRepository';
import SqliteOrderQueryService from '../openMarket/infrastructure/order/SqliteOrderQueryService';
import Order from '../openMarket/domain/order/Order';

const DAY = '2026-10-21';

describe('OrdersQuery', () => {
  let file;
  let connection;

  beforeEach(() => {
    file = path.join(os.tmpdir(), `om-orders-query-${Date.now()}-${Math.random()}.sqlite`);
    connection = new SqliteConnection({filename: file});
    insertOrder(connection, {id: 'b-same', at: `${DAY} 12:00:00`, cents: 10, method: 'cash', invoice: '2026/000010', number: 10, lines: 1});
    insertOrder(connection, {id: 'a-same', at: `${DAY} 12:00:00`, cents: 20, method: 'cash', invoice: '2026/000011', number: 11, lines: 1});
    insertOrder(connection, {id: 'newer', at: `${DAY} 10:00:01`, cents: 350, method: 'card', invoice: '2026/000002', number: 2, lines: 2});
    insertOrder(connection, {id: 'older', at: `${DAY} 10:00:00`, cents: 200, method: 'cash', invoice: '2026/000001', number: 1, lines: 1});
    insertOrder(connection, {id: 'void', at: `${DAY} 09:00:00`, cents: 100, method: 'cash', invoice: '2026/000003', number: 3, lines: 1, status: 'CANCELLED'});
    insertOrder(connection, {id: 'bare', at: `${DAY} 08:00:00`, cents: 50, method: null, lines: 1});
    insertOrder(connection, {id: 'legacy', at: `${DAY} 07:00:00`, euros: 1.25, method: 'cash', invoice: '2026/000004', number: 4, lines: 1});
    insertOrder(connection, {id: 'prev', at: '2026-10-20 18:00:00', cents: 500, method: 'cash', invoice: '2026/000020', number: 20, lines: 1});
    insertOrder(connection, {id: 'half1', at: '2026-10-19 10:00:00', cents: 100, method: 'cash', invoice: '2026/000030', number: 30, lines: 1});
    insertOrder(connection, {id: 'half2', at: '2026-10-19 11:00:00', cents: 101, method: 'card', invoice: '2026/000031', number: 31, lines: 1});
    insertOrder(connection, {id: 'day22', at: '2026-10-22 09:00:00', cents: 10, method: 'cash', invoice: '2026/000040', number: 40, lines: 1});
  });

  afterEach(() => {
    connection.database.close();
    fs.rmSync(file, {force: true});
    fs.rmSync(`${file}-wal`, {force: true});
    fs.rmSync(`${file}-shm`, {force: true});
  });

  it('lists the newest order first with invoice, count, and cancelled flag', done => {
    const query = new SqliteOrdersQuery({connection});
    query.list({from: `${DAY} 00:00:00`, to: `${DAY} 23:59:59`, limit: 20, offset: 0}).subscribe(
      page => {
        expect(page.total).to.equal(7);
        expect(page.items.map(item => item.orderId)).to.deep.equal([
          'b-same', 'a-same', 'newer', 'older', 'void', 'bare', 'legacy'
        ]);
        const newer = page.items[2];
        expect(newer.invoiceNumber).to.equal('2026/000002');
        expect(newer.itemCount).to.equal(2);
        expect(newer.paymentMethod).to.equal('card');
        expect(newer.totalCents).to.equal(350);
        expect(newer.createdAt).to.equal(`${DAY}T10:00:01`);
        expect(newer.cancelled).to.equal(false);
        expect(newer).to.not.be.instanceof(Order);
        expect(page.items[4].cancelled).to.equal(true);
        expect(page.items[4].invoiceNumber).to.equal('2026/000003');
        expect(page.items[5].invoiceNumber).to.equal('—');
        expect(page.items[6].totalCents).to.equal(125);
      },
      error => done(error),
      () => done()
    );
  });

  it('summarises the day in cents and excludes the other day', done => {
    const query = new SqliteOrdersQuery({connection});
    query.daySummary({from: `${DAY} 00:00:00`, to: `${DAY} 23:59:59`}).subscribe(
      summary => {
        expect(summary).to.deep.equal({totalCents: 855, ticketCount: 7, averageCents: 122});
      },
      error => done(error),
      () => done()
    );
  });

  it('rounds a half-cent average up and returns zero outside the sales', done => {
    const query = new SqliteOrdersQuery({connection});
    query.daySummary({from: '2026-10-19 00:00:00', to: '2026-10-19 23:59:59'})
      .flatMap(half => query.daySummary({from: '2026-10-18 00:00:00', to: '2026-10-18 23:59:59'})
        .map(empty => ({half, empty})))
      .subscribe(
        ({half, empty}) => {
          expect(half).to.deep.equal({totalCents: 201, ticketCount: 2, averageCents: 101});
          expect(empty).to.deep.equal({totalCents: 0, ticketCount: 0, averageCents: 0});
        },
        error => done(error),
        () => done()
      );
  });

  it('keeps the range total when the page is past the first rows', done => {
    const query = new SqliteOrdersQuery({connection});
    query.list({from: `${DAY} 00:00:00`, to: `${DAY} 23:59:59`, limit: 1, offset: 6}).subscribe(
      page => {
        expect(page.total).to.equal(7);
        expect(page.items.map(item => item.orderId)).to.deep.equal(['legacy']);
      },
      error => done(error),
      () => done()
    );
  });

  it('returns repository orders newest first and keeps daily totals ascending', done => {
    const orders = new SqliteOrderRepository({
      connection,
      objectMapper: {},
      queryService: new SqliteOrderQueryService()
    });
    const start = moment(`${DAY} 00:00:00`, 'YYYY-MM-DD HH:mm:ss');
    const end = moment('2026-10-22 23:59:59', 'YYYY-MM-DD HH:mm:ss');
    orders.findAllByDates({limit: 20, offset: 0, startDate: start, endDate: end})
      .flatMap(rows => orders.calculateTotalAmountByDays({startDate: start, endDate: end})
        .map(days => ({rows, days})))
      .subscribe(
        ({rows, days}) => {
          expect(rows.map(row => row.id)).to.deep.equal([
            'day22', 'b-same', 'a-same', 'newer', 'older', 'void', 'bare', 'legacy'
          ]);
          expect(days.map(day => day.createdAt)).to.deep.equal(['21/10/2026', '22/10/2026']);
        },
        error => done(error),
        () => done()
      );
  });
});

/**
 * @param {SqliteConnection} connection
 * @param {{id: string, at: string, cents?: number, euros?: number, method: string | null, invoice?: string, number?: number, lines: number, status?: string}} order
 */
/**
 * @param {{cents?: number, euros?: number}} order
 * @returns {{cents: number | null, euros: number}}
 */
function storedAmounts(order) {
  const cents = order.cents == null ? null : order.cents;
  if (order.euros != null) {
    return {cents, euros: order.euros};
  }
  return {cents, euros: cents == null ? 0 : cents / 100};
}

/**
 * @param {SqliteConnection} connection
 * @param {{id: string, lines: number}} order
 * @param {{cents: number | null, euros: number}} amounts
 */
function insertLines(connection, order, amounts) {
  const line = connection.database.prepare(
    'INSERT INTO line (order_id, barcode, name, price, quantity, price_cents, quantity_milli, amount_cents) ' +
    'VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  );
  for (let index = 0; index < order.lines; index += 1) {
    line.run(order.id, '000' + index, 'Item', amounts.euros, 1, amounts.cents, 1000, amounts.cents);
  }
}

/**
 * @param {SqliteConnection} connection
 * @param {{id: string, at: string, invoice?: string, number?: number, status?: string}} order
 * @param {{cents: number | null, euros: number}} amounts
 */
function insertInvoice(connection, order, amounts) {
  if (!order.invoice) {
    return;
  }
  const status = order.status || 'ISSUED';
  const invoiceCents = amounts.cents == null ? Math.round(amounts.euros * 100) : amounts.cents;
  connection.database.prepare(
    'INSERT INTO invoice (id, series, number, invoice_number, issued_at, order_id, status, cancelled_at, total, total_cents, issue_date, type) ' +
    'VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
  ).run(
    'inv-' + order.id,
    '2026',
    order.number,
    order.invoice,
    order.at,
    order.id,
    status,
    status === 'CANCELLED' ? order.at : null,
    amounts.euros,
    invoiceCents,
    order.at.slice(0, 10),
    'F2'
  );
}

/**
 * @param {SqliteConnection} connection
 * @param {{id: string, at: string, cents?: number, euros?: number, method: string | null, invoice?: string, number?: number, lines: number, status?: string}} order
 */
function insertOrder(connection, order) {
  const amounts = storedAmounts(order);
  connection.database.prepare(
    'INSERT INTO "order" (id, created_at, total, total_cents, payment_method, tendered_cents, change_cents) ' +
    'VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).run(order.id, order.at, amounts.euros, amounts.cents, order.method, amounts.cents, 0);
  insertLines(connection, order, amounts);
  insertInvoice(connection, order, amounts);
}
