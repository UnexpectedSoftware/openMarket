import {expect} from 'chai';
import moment from 'moment';
import SqliteConnection from '../../../../../openMarket/infrastructure/service/SqliteConnection';
import SqliteProductSaleStatisticsRepository from '../../../../../openMarket/infrastructure/product/SqliteProductSaleStatisticsRepository';
import ProductSaleStatistics from '../../../../../openMarket/application/service/product/ProductSaleStatistics';
import {fillSeries, previousYearRange, resolveSalesWindow} from '../../../../../openMarket/application/service/product/salesWindows';

describe('sales windows', () => {
  const now = moment('2026-10-01', 'YYYY-MM-DD');

  it('resolves each selector as a range ending today', () => {
    expect(resolveSalesWindow('last_7_days', now)).to.deep.equal({
      window: 'last_7_days',
      bucket: 'day',
      startOn: '2026-09-25',
      endOn: '2026-10-01'
    });
    expect(resolveSalesWindow('day', now).startOn).to.equal('2026-10-01');
    expect(resolveSalesWindow('month', now)).to.include({bucket: 'day', startOn: '2026-09-01'});
    expect(resolveSalesWindow('three_months', now)).to.include({bucket: 'month', startOn: '2026-07-01'});
    expect(resolveSalesWindow('six_months', now)).to.include({bucket: 'month', startOn: '2026-04-01'});
    expect(resolveSalesWindow('year', now)).to.include({bucket: 'month', startOn: '2025-10-01'});
    expect(previousYearRange(resolveSalesWindow('last_7_days', now))).to.deep.equal({
      startOn: '2025-09-25',
      endOn: '2025-10-01'
    });
    expect(previousYearRange(resolveSalesWindow('year', now))).to.deep.equal({
      startOn: '2024-10-01',
      endOn: '2025-10-01'
    });
  });

  it('rejects an unknown window', () => {
    expect(() => resolveSalesWindow('week', now)).to.throw('Unknown sales window week');
  });

  it('fills missing days and months with zeros', () => {
    const days = fillSeries({
      startOn: '2026-09-25',
      endOn: '2026-10-01',
      bucket: 'day',
      rows: [{soldOn: '2026-09-26', quantity: 2, amount: 1}]
    });
    expect(days).to.have.lengthOf(7);
    expect(days[0]).to.deep.equal({soldOn: '2026-09-25', quantity: 0, amount: 0});
    expect(days[1].quantity).to.equal(2);

    const months = fillSeries({
      startOn: '2025-10-01',
      endOn: '2026-10-01',
      bucket: 'month',
      rows: [{soldOn: '2026-01', quantity: 4, amount: 8}]
    });
    expect(months).to.have.lengthOf(13);
    expect(months[0].soldOn).to.equal('2025-10');
    expect(months[months.length - 1].soldOn).to.equal('2026-10');
    expect(months.find(point => point.soldOn === '2026-01').quantity).to.equal(4);
    expect(months.find(point => point.soldOn === '2026-02').quantity).to.equal(0);
  });
});

describe('Product sale statistics', () => {
  let connection;
  let repository;
  let useCase;

  beforeEach(() => {
    connection = new SqliteConnection({filename: ':memory:'});
    connection.database.prepare('INSERT INTO product (barcode, name) VALUES (?, ?)').run('0001', 'Current cola');
    repository = new SqliteProductSaleStatisticsRepository({connection});
    useCase = new ProductSaleStatistics({repository});
  });

  function at(day) {
    return day.format('DD/MM/YYYY') + ' 10:00:00';
  }

  function read(done, barcode, window, assert) {
    useCase.salesOfProduct({barcode, window}).subscribe(
      result => {
        try {
          assert(result);
          done();
        } catch (error) {
          done(error);
        }
      },
      error => done(error)
    );
  }

  it('sums lines of the same product on the same day and fills quiet days', (done) => {
    const yesterday = moment().startOf('day').subtract(1, 'day');
    repository.applyOrder({
      createdAt: at(yesterday),
      lines: [
        {barcode: '0001', name: 'Old cola', price: 2, quantity: 2},
        {barcode: '0001', name: 'Old cola', price: 2, quantity: 2}
      ]
    });
    repository.applyOrder({
      createdAt: at(yesterday),
      lines: [{barcode: '0001', name: 'Old cola', price: 2, quantity: 1}]
    });

    read(done, '0001', 'last_7_days', result => {
      expect(result.series).to.have.lengthOf(7);
      expect(result.quantity).to.equal(5);
      expect(result.amount).to.equal(10);
      const gap = moment().startOf('day').subtract(2, 'days').format('YYYY-MM-DD');
      expect(result.series.find(point => point.soldOn === gap).quantity).to.equal(0);
    });
  });

  it('returns zeros for a barcode with no sales', (done) => {
    read(done, 'missing', 'day', result => {
      expect(result.quantity).to.equal(0);
      expect(result.amount).to.equal(0);
      expect(result.series).to.have.lengthOf(1);
    });
  });

  it('buckets a year by month', (done) => {
    const older = moment().startOf('day').subtract(4, 'months');
    repository.applyOrder({
      createdAt: at(older),
      lines: [{barcode: '0001', name: 'Old cola', price: 1, quantity: 3}]
    });
    repository.applyOrder({
      createdAt: at(moment().startOf('day')),
      lines: [{barcode: '0001', name: 'Old cola', price: 1, quantity: 1}]
    });
    const range = resolveSalesWindow('year');
    read(done, '0001', 'year', result => {
      expect(result.series[0].soldOn).to.have.lengthOf(7);
      expect(result.series).to.have.lengthOf(fillSeries({
        startOn: range.startOn,
        endOn: range.endOn,
        bucket: 'month',
        rows: []
      }).length);
      expect(result.quantity).to.equal(4);
      expect(result.series.filter(point => point.quantity > 0)).to.have.lengthOf(2);
    });
  });

  it('ranks by quantity, then amount, and keeps the current product name', (done) => {
    connection.database.prepare('UPDATE product SET image_name = ? WHERE barcode = ?').run('0001.png', '0001');
    const today = at(moment().startOf('day'));
    repository.applyOrder({
      createdAt: today,
      lines: [
        {barcode: '0001', name: 'Old cola', price: 1, quantity: 4},
        {barcode: '0002', name: 'Water', price: 3, quantity: 4},
        {barcode: '0003', name: 'Bread', price: 50, quantity: 1}
      ]
    });
    for (let quantity = 1; quantity <= 12; quantity += 1) {
      if (quantity === 4 || quantity === 1) {
        continue;
      }
      repository.applyOrder({
        createdAt: today,
        lines: [{barcode: 'p' + quantity, name: 'P' + quantity, price: 1, quantity}]
      });
    }

    useCase.mostSold({window: 'day', limit: 10}).subscribe(
      result => {
        try {
          expect(result.products).to.have.lengthOf(10);
          expect(result.products[0]).to.include({barcode: 'p12', quantity: 12});
          const cola = result.products.find(product => product.barcode === '0001');
          const water = result.products.find(product => product.barcode === '0002');
          expect(cola.name).to.equal('Current cola');
          expect(cola.imageName).to.equal('0001.png');
          expect(cola.previousQuantity).to.equal(0);
          expect(water.imageName).to.equal(null);
          expect(water.previousQuantity).to.equal(0);
          expect(result.products.indexOf(water)).to.be.below(result.products.indexOf(cola));
          expect(result.products.map(product => product.quantity)).to.not.include(2);
          done();
        } catch (error) {
          done(error);
        }
      },
      error => done(error)
    );
  });

  it('attaches the quantity sold in the same window last year', (done) => {
    const today = moment().startOf('day');
    repository.applyOrder({
      createdAt: at(today),
      lines: [
        {barcode: '0001', name: 'Cola', price: 1, quantity: 10},
        {barcode: '0002', name: 'Water', price: 1, quantity: 4}
      ]
    });
    repository.applyOrder({
      createdAt: at(today.clone().subtract(1, 'year')),
      lines: [
        {barcode: '0001', name: 'Cola', price: 1, quantity: 8},
        {barcode: '0009', name: 'Gone', price: 1, quantity: 50}
      ]
    });

    useCase.mostSold({window: 'day', limit: 10}).subscribe(
      result => {
        try {
          expect(result.products.map(product => product.barcode)).to.deep.equal(['0001', '0002']);
          expect(result.products[0].previousQuantity).to.equal(8);
          expect(result.products[1].previousQuantity).to.equal(0);
          done();
        } catch (error) {
          done(error);
        }
      },
      error => done(error)
    );
  });

  it('rebuilds daily counters from stored order lines', () => {
    const database = connection.database;
    database.prepare('INSERT INTO "order" (id, created_at, total) VALUES (?, ?, ?)').run(
      'o1', '2020-03-02 10:00:00', 1.1
    );
    database.prepare('INSERT INTO "order" (id, created_at, total) VALUES (?, ?, ?)').run(
      'o2', '2020-03-02 11:00:00', 1.65
    );
    const insertLine = database.prepare(
      'INSERT INTO line (order_id, barcode, name, price, quantity) VALUES (?, ?, ?, ?, ?)'
    );
    insertLine.run('o1', '0001', 'Old cola', 0.55, 2);
    insertLine.run('o2', '0001', 'Old cola', 0.55, 3);

    repository.rebuildFromOrders();
    repository.applyOrder({
      createdAt: '02/03/2020 12:00:00',
      lines: [{barcode: '0001', name: 'Old cola', price: 0.55, quantity: 1}]
    });

    const row = database.prepare(
      'SELECT quantity, amount, name FROM product_sale_day WHERE barcode = ? AND sold_on = ?'
    ).get('0001', '2020-03-02');
    expect(row.quantity).to.equal(6);
    expect(row.amount).to.equal(3.3);
    expect(row.name).to.equal('Old cola');
  });
});
