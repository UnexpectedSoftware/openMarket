import { expect } from 'chai';
import Money from '../../../../openMarket/domain/money/Money';
import Order from '../../../../openMarket/domain/order/Order';
import { buildDemoOrders } from '../../../../openMarket/infrastructure/dev/demoOrders';

const DISPLAY_FORMAT = /^(\d{2})\/(\d{2})\/(\d{4}) (\d{2}):(\d{2}):(\d{2})$/;

const products = [
  { _barcode: '1001', _name: 'Fideo', _price: 1.25, _status: 'ENABLED', _weighted: false, _vatPercent: 10 },
  { _barcode: '1002', _name: 'Manzana', _price: 2.4, _status: 'ENABLED', _weighted: true, _vatPercent: 4 },
  { _barcode: '1003', _name: 'Hidden', _price: 9, _status: 'DISABLED', _weighted: false },
  { _barcode: '1004', _name: '   ', _price: 2, _status: 'ENABLED' },
  { _barcode: '1005', _name: 'No price', _price: null, _status: 'ENABLED' }
];

describe('Demo orders', () => {
  const now = new Date(2026, 8, 25, 15, 0, 0);
  const tickets = buildDemoOrders(products, now);
  const orders = tickets.map(ticket => ticket.order);

  it('fills forty-five shop days, with two quiet days and a busier Saturday', () => {
    const counts = countsByDay(orders);
    const days = eachDay(now, 45);
    expect(days).to.have.length(45);
    const empty = days.filter(day => !counts.has(dayKey(day)));
    expect(empty).to.have.length(2);

    const saturday = [];
    const weekday = [];
    const sunday = [];
    days.forEach(day => {
      const count = counts.get(dayKey(day)) || 0;
      if (count === 0) {
        return;
      }
      const created = orders.find(order => order.createdAt.slice(0, 10) === dayKey(day));
      expect(insideOpenHours(created._createdAt)).to.equal(true);
      if (day.getDay() === 6) {
        saturday.push(count);
      } else if (day.getDay() === 0) {
        sunday.push(count);
      } else {
        weekday.push(count);
      }
    });
    expect(Math.min(...saturday)).to.be.above(Math.max(...weekday));
    expect(Math.max(...sunday)).to.be.below(Math.min(...weekday));
  });

  it('sells placed orders, weighed lines in kilograms, and pays with every method', () => {
    expect(orders.length).to.be.above(0);
    const methods = new Set();
    orders.forEach(order => {
      expect(order).to.be.instanceOf(Order);
      expect(order.isPlaced()).to.equal(true);
      methods.add(order.payment.method);
      expect(order.lines.length).to.be.within(1, 4);
      order.lines.forEach(line => {
        expect(['1001', '1002']).to.include(line.barcode);
        expect(line.name).to.equal(line.barcode === '1001' ? 'Fideo' : 'Manzana');
      });
      const total = order.lines.reduce(
        (sum, line) => sum.plus(line.price.times(line.quantity)),
        Money.ofCents(0)
      );
      expect(order.total.cents).to.equal(total.cents);
      expect(order.payment.tenderedCents - order.payment.changeCents).to.equal(total.cents);
    });
    expect([...methods].sort()).to.deep.equal(['bizum', 'card', 'cash', 'mixed']);

    const all = orders.reduce((lines, order) => lines.concat(order.lines), []);
    const weighed = all.filter(line => line.weighted);
    expect(weighed.length).to.be.above(0);
    weighed.forEach(line => {
      expect(line.barcode).to.equal('1002');
      expect(line.quantity.milli % 1000).to.not.equal(0);
      expect(line.vatRate.percent).to.equal(4);
    });
    all.filter(line => !line.weighted).forEach(line => {
      expect(line.weighted).to.equal(false);
      expect(line.quantity.milli % 1000).to.equal(0);
      expect(line.vatRate.percent).to.equal(10);
    });

    orders.filter(order => order.payment.method === 'cash').forEach(order => {
      expect(order.payment.changeCents).to.be.above(0);
      expect(order.payment.parts).to.equal(null);
    });
    orders.filter(order => order.payment.method === 'mixed').forEach(order => {
      expect(order.payment.changeCents).to.equal(0);
      expect(order.payment.parts).to.have.length(2);
      expect(order.payment.parts[0].method).to.not.equal(order.payment.parts[1].method);
      const split = order.payment.parts[0].amountCents + order.payment.parts[1].amountCents;
      expect(split).to.equal(order.total.cents);
    });
  });

  it('numbers tickets in time order and restarts the series each year', () => {
    expectSequential(tickets);
    expect(orders[0].id).to.equal('1');
    expect(tickets[0].invoice.series).to.equal('2026');
    expect(tickets[0].invoice.number).to.equal(1);

    const yearTurn = new Date(2026, 0, 5, 15, 0, 0);
    const turned = buildDemoOrders(products, yearTurn);
    expectSequential(turned);
    const december = turned.find(ticket => ticket.order.createdAt.slice(3, 10) === '12/2025');
    const january = turned.find(ticket => ticket.order.createdAt.slice(3, 10) === '01/2026');
    expect(december.invoice.series).to.equal('2025');
    expect(january.invoice.series).to.equal('2026');
    expect(january.invoice.number).to.equal(1);
  });

  it('repeats the same tickets for the same moment', () => {
    expect(buildDemoOrders(products, now)).to.deep.equal(tickets);
  });

  it('sells nothing when every product is unsellable', () => {
    expect(buildDemoOrders([])).to.deep.equal([]);
    expect(buildDemoOrders([{_status: 'DISABLED', _name: 'Hidden', _price: 1}])).to.deep.equal([]);
  });
});

/**
 * @param {Array<{order: Order, invoice: import('../../../../openMarket/domain/invoice/InvoiceNumber').default}>} tickets
 */
function expectSequential(tickets) {
  const next = {};
  tickets.forEach(({order, invoice}) => {
    const series = order.createdAt.slice(6, 10);
    const number = (next[series] || 0) + 1;
    expect(invoice.series).to.equal(series);
    expect(invoice.number).to.equal(number);
    expect(invoice.formatted).to.equal(series + '/' + String(number).padStart(6, '0'));
    next[series] = number;
  });
}

/**
 * @param {Order[]} orders
 * @returns {Map<string, number>}
 */
function countsByDay(orders) {
  const counts = new Map();
  orders.forEach(order => {
    const key = order.createdAt.slice(0, 10);
    counts.set(key, (counts.get(key) || 0) + 1);
  });
  return counts;
}

/**
 * @param {Date} now
 * @param {number} span
 * @returns {Date[]}
 */
function eachDay(now, span) {
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  start.setDate(start.getDate() - (span - 1));
  const days = [];
  for (let index = 0; index < span; index += 1) {
    const day = new Date(start.getTime());
    day.setDate(start.getDate() + index);
    days.push(day);
  }
  return days;
}

/**
 * @param {Date} day
 * @returns {string}
 */
function dayKey(day) {
  const pad = value => String(value).padStart(2, '0');
  return pad(day.getDate()) + '/' + pad(day.getMonth() + 1) + '/' + day.getFullYear();
}

/**
 * @param {string} createdAt
 * @returns {boolean}
 */
function insideOpenHours(createdAt) {
  const match = DISPLAY_FORMAT.exec(createdAt);
  expect(match).to.not.equal(null);
  const minutes = Number(match[4]) * 60 + Number(match[5]);
  return minutes >= 10 * 60 && minutes < 20 * 60 + 30;
}
