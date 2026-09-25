import { expect } from 'chai';
import moment from 'moment';
import { add, multiply } from '../../../../openMarket/infrastructure/service/floatCalculatorService';
import { buildDemoOrders } from '../../../../openMarket/infrastructure/dev/demoOrders';

const DISPLAY_FORMAT = 'DD/MM/YYYY HH:mm:ss';

const products = [
  { _barcode: '1001', _name: 'Fideo', _price: 1.25, _status: 'ENABLED' },
  { _barcode: '1002', _name: 'Turron', _price: 3.4, _status: 'ENABLED' },
  { _barcode: '1003', _name: 'Hidden', _price: 9, _status: 'DISABLED' },
  { _barcode: '1004', _name: '   ', _price: 2, _status: 'ENABLED' },
  { _barcode: '1005', _name: 'No price', _price: null, _status: 'ENABLED' }
];

describe('Demo orders', () => {
  const now = new Date(2026, 8, 25, 15, 0, 0);
  const orders = buildDemoOrders(products, now);

  it('fills each of the seven shop days and keeps every ticket inside the window', () => {
    const earliest = moment(now).startOf('day').subtract(6, 'days').hour(10);
    const latest = moment(now).subtract(1, 'minute');
    const days = new Set();

    orders.forEach(order => {
      const created = moment(order._createdAt, DISPLAY_FORMAT, true);
      expect(created.isValid()).to.equal(true);
      expect(created.isBetween(earliest, latest, undefined, '[]')).to.equal(true);
      days.add(created.format('YYYY-MM-DD'));
    });

    expect(days.size).to.equal(7);
  });

  it('uses sellable products and makes the total match the lines', () => {
    expect(orders.length).to.be.above(0);
    orders.forEach(order => {
      expect(order._lines.length).to.be.within(1, 4);
      order._lines.forEach(line => {
        expect(['1001', '1002']).to.include(line.barcode);
        expect(line.quantity).to.be.within(1, 3);
      });
      const total = order._lines.reduce((sum, line) => add(sum, multiply(line.price, line.quantity)), 0);
      expect(order._total).to.equal(total);
    });
  });

  it('repeats the same tickets for the same moment', () => {
    expect(buildDemoOrders(products, now)).to.deep.equal(orders);
  });
});
