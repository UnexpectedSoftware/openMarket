import fs from 'fs';
import os from 'os';
import path from 'path';
import {expect} from 'chai';
import SqliteConnection from '../openMarket/infrastructure/service/SqliteConnection';
import SqliteOrderRepository from '../openMarket/infrastructure/order/SqliteOrderRepository';
import SqliteOrderQueryService from '../openMarket/infrastructure/order/SqliteOrderQueryService';
import Order from '../openMarket/domain/order/Order';
import OrderDetail from '../openMarket/domain/order/OrderDetail';

describe('OrderRepository detail', () => {
  let file;
  let connection;

  beforeEach(() => {
    file = path.join(os.tmpdir(), `om-order-detail-${Date.now()}-${Math.random()}.sqlite`);
    connection = new SqliteConnection({filename: file});
    insertProduct(connection, {barcode: 'ham', weighted: 1});
    insertProduct(connection, {barcode: 'milk', weighted: 0});
    insertProduct(connection, {barcode: 'cheese', weighted: 1});
    insertSale(connection, {
      id: 'mixed',
      at: '2026-10-21 10:00:00',
      totalCents: 1313,
      method: 'cash',
      tenderedCents: 2000,
      changeCents: 687,
      invoice: '2026/000042',
      number: 42,
      status: 'ISSUED',
      lines: [
        line({barcode: 'ham', name: 'Ham', cents: 1850, milli: 350, amount: 648, percent: 10, kind: 'PRODUCT'}),
        line({barcode: '', name: 'Bolsa', cents: 465, milli: 1000, amount: 465, percent: 21, kind: 'FREE'}),
        line({barcode: 'milk', name: 'Milk', cents: 200, milli: 1000, amount: 200, percent: 21, kind: 'PRODUCT'}),
        line({barcode: 'cheese', name: 'Cheese', cents: 1000, milli: 1000, amount: 1000, percent: 10, kind: 'PRODUCT'})
      ],
      vat: [
        {kind: 'S1', percent: 10, cause: null, base: 1498, quota: 150},
        {kind: 'S1', percent: 21, cause: null, base: 550, quota: 115}
      ]
    });
    // 648+465+200+1000 = 2313, not 1313. The read model must return the invoice total, not a sum.
    // Keep the stored invoice total at 1313 so the test proves we do not recompute it.
    insertSale(connection, {
      id: 'void',
      at: '2026-10-21 11:00:00',
      totalCents: 100,
      method: 'card',
      tenderedCents: null,
      changeCents: null,
      invoice: '2026/000043',
      number: 43,
      status: 'CANCELLED',
      lines: [line({barcode: 'milk', name: 'Milk', cents: 100, milli: 1000, amount: 100, percent: 21, kind: 'PRODUCT'})],
      vat: [{kind: 'S1', percent: 21, cause: null, base: 83, quota: 17}]
    });
    insertSale(connection, {
      id: 'bare',
      at: '2026-10-21 08:00:00',
      totalCents: 50,
      method: null,
      tenderedCents: null,
      changeCents: null,
      lines: []
    });
  });

  afterEach(() => {
    connection.database.close();
    fs.rmSync(file, {force: true});
    fs.rmSync(`${file}-wal`, {force: true});
    fs.rmSync(`${file}-shm`, {force: true});
  });

  it('reads invoice lines, VAT, and the invoice total for a mixed sale', done => {
    repository(connection).find({id: 'mixed'}).subscribe(
      detail => {
        expect(detail).to.be.instanceof(OrderDetail);
        expect(detail).to.not.be.instanceof(Order);
        expect(Object.isFrozen(detail)).to.equal(true);
        expect(detail.orderId).to.equal('mixed');
        expect(detail.invoiceNumber).to.equal('2026/000042');
        expect(detail.invoiceType).to.equal('F2');
        expect(detail.cancelled).to.equal(false);
        expect(detail.createdAt).to.equal('2026-10-21T10:00:00');
        expect(detail.totalCents).to.equal(1313);
        expect(detail.payment).to.deep.equal({method: 'cash', tenderedCents: 2000, changeCents: 687});
        expect(detail.lines.map(line => line.name)).to.deep.equal(['Ham', 'Bolsa', 'Milk', 'Cheese']);
        expect(detail.lines.map(line => line.kind)).to.deep.equal(['PRODUCT', 'FREE', 'PRODUCT', 'PRODUCT']);
        expect(detail.lines.map(line => line.weighted)).to.deep.equal([true, false, false, true]);
        expect(detail.lines[0].quantityMilli).to.equal(350);
        expect(detail.lines[0].unitPriceCents).to.equal(1850);
        expect(detail.lines[0].amountCents).to.equal(648);
        expect(detail.lines[0].vat).to.deep.equal({kind: 'S1', percent: 10, cause: null});
        expect(detail.lines[1].barcode).to.equal('');
        expect(detail.vat).to.deep.equal([
          {kind: 'S1', percent: 10, cause: null, baseCents: 1498, quotaCents: 150},
          {kind: 'S1', percent: 21, cause: null, baseCents: 550, quotaCents: 115}
        ]);
      },
      error => done(error),
      () => done()
    );
  });

  it('flags a cancelled invoice and returns null for an unknown id', done => {
    const orders = repository(connection);
    orders.find({id: 'void'}).subscribe(
      detail => {
        expect(detail.cancelled).to.equal(true);
        expect(detail.invoiceNumber).to.equal('2026/000043');
        expect(detail.payment).to.deep.equal({method: 'card', tenderedCents: null, changeCents: null});
        expect(detail).to.not.be.instanceof(Order);
        orders.find({id: 'missing'}).subscribe(
          missing => {
            expect(missing).to.equal(null);
            orders.find({id: 'bare'}).subscribe(
              bare => {
                expect(bare).to.be.instanceof(OrderDetail);
                expect(bare).to.not.be.instanceof(Order);
                expect(bare.invoiceNumber).to.equal('—');
                expect(bare.lines).to.deep.equal([]);
                expect(bare.totalCents).to.equal(50);
              },
              error => done(error),
              () => done()
            );
          },
          error => done(error)
        );
      },
      error => done(error)
    );
  });
});

/**
 * @param {SqliteConnection} connection
 * @returns {SqliteOrderRepository}
 */
function repository(connection) {
  return new SqliteOrderRepository({
    connection,
    objectMapper: {},
    queryService: new SqliteOrderQueryService()
  });
}

/**
 * @param {SqliteConnection} connection
 * @param {{barcode: string, weighted: number}} product
 */
function insertProduct(connection, product) {
  connection.database.prepare(
    'INSERT INTO product (barcode, name, price, base_price, stock, stock_min, status, weighted) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  ).run(product.barcode, product.barcode, 1, 1, 5, 1, 'ENABLED', product.weighted);
}

/**
 * @param {{barcode: string, name: string, cents: number, milli: number, amount: number, percent: number, kind: string}} props
 */
function line(props) {
  return props;
}

/**
 * @param {SqliteConnection} connection
 * @param {object} sale
 */
function insertSale(connection, sale) {
  const euros = sale.totalCents / 100;
  connection.database.prepare(
    'INSERT INTO "order" (id, created_at, total, total_cents, payment_method, tendered_cents, change_cents) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).run(sale.id, sale.at, euros, sale.totalCents, sale.method, sale.tenderedCents, sale.changeCents);
  if (!sale.invoice) {
    return;
  }
  connection.database.prepare(
    'INSERT INTO invoice (id, series, number, invoice_number, issued_at, order_id, status, cancelled_at, total, total_cents, issue_date, type) ' +
    'VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
  ).run(
    'inv-' + sale.id,
    '2026',
    sale.number,
    sale.invoice,
    sale.at,
    sale.id,
    sale.status,
    sale.status === 'CANCELLED' ? sale.at : null,
    euros,
    sale.totalCents,
    sale.at.slice(0, 10),
    'F2'
  );
  const insertLine = connection.database.prepare(
    'INSERT INTO invoice_line (invoice_id, position, barcode, name, price, quantity, amount, price_cents, quantity_milli, amount_cents, vat_percent, vat_kind, vat_cause, kind) ' +
    'VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
  );
  sale.lines.forEach((item, position) => {
    insertLine.run(
      'inv-' + sale.id,
      position,
      item.barcode,
      item.name,
      item.cents / 100,
      item.milli / 1000,
      item.amount / 100,
      item.cents,
      item.milli,
      item.amount,
      item.percent,
      'S1',
      null,
      item.kind
    );
  });
  const insertVat = connection.database.prepare(
    'INSERT INTO invoice_vat (invoice_id, position, kind, percent, cause, base_cents, quota_cents, gross_cents) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  );
  sale.vat.forEach((row, position) => {
    insertVat.run(
      'inv-' + sale.id,
      position,
      row.kind,
      row.percent,
      row.cause,
      row.base,
      row.quota,
      row.base + row.quota
    );
  });
}
