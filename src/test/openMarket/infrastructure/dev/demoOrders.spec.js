import { expect } from 'chai';
import Money from '../../../../openMarket/domain/money/Money';
import Quantity from '../../../../openMarket/domain/money/Quantity';
import VatRate from '../../../../openMarket/domain/tax/VatRate';
import { buildDemoOrders, soldQuantities } from '../../../../openMarket/infrastructure/dev/demoOrders';

function product(barcode, name, euros, {weighted = false, vat = 21, enabled = true} = {}) {
  return {
    barcode,
    name,
    description: '',
    price: Money.fromEuros(euros),
    basePrice: Money.fromEuros(euros),
    stockMin: 5,
    weighted,
    vatRate: VatRate.standard(vat),
    categoryName: 'Despensa',
    closingStock: 10,
    enabled,
    image: false
  };
}

const products = [
  product('1001', 'Fideo', '1.25', {vat: 10}),
  product('1002', 'Manzana', '2.40', {weighted: true, vat: 4}),
  product('1003', 'Hidden', '9.00', {enabled: false})
];

describe('Demo orders', () => {
  const now = new Date(2026, 8, 25, 15, 0, 0);
  const tickets = buildDemoOrders(products, now);

  it('fills forty-five shop days in time order, with two quiet days and a busier Saturday', () => {
    const counts = new Map();
    tickets.forEach(ticket => {
      const key = dayKey(ticket.at);
      counts.set(key, (counts.get(key) || 0) + 1);
      const minutes = ticket.at.getHours() * 60 + ticket.at.getMinutes();
      expect(minutes).to.be.within(10 * 60, 20 * 60 + 29);
      expect(ticket.at.getTime()).to.be.below(now.getTime());
    });
    expect(tickets.map(ticket => ticket.at.getTime()))
      .to.deep.equal(tickets.map(ticket => ticket.at.getTime()).sort((left, right) => left - right));
    const days = eachDay(now, 45);
    expect(days.filter(day => !counts.has(dayKey(day)))).to.have.length(2);
    const byWeekday = weekday => days.filter(day => day.getDay() === weekday && counts.has(dayKey(day)))
      .map(day => counts.get(dayKey(day)));
    const weekdays = [1, 2, 3, 4, 5].reduce((all, weekday) => all.concat(byWeekday(weekday)), []);
    expect(Math.min(...byWeekday(6))).to.be.above(Math.max(...weekdays));
    expect(Math.max(...byWeekday(0))).to.be.below(Math.min(...weekdays));
  });

  it('sells enabled products, weighed lines in kilograms, and pays with every method', () => {
    const methods = new Set();
    tickets.forEach(ticket => {
      expect(ticket.lines.length).to.be.within(1, 2);
      const total = ticket.lines.reduce(
        (sum, line) => sum.plus(line.price.times(line.quantity)),
        Money.ofCents(0)
      );
      expect(ticket.payment.tenderedCents - ticket.payment.changeCents).to.equal(total.cents);
      methods.add(ticket.payment.method);
      ticket.lines.forEach(line => {
        expect(['1001', '1002']).to.include(line.barcode);
        expect(line.quantity).to.be.instanceOf(Quantity);
        expect(line.weighted).to.equal(line.barcode === '1002');
        expect(line.vatRate.percent).to.equal(line.weighted ? 4 : 10);
        expect(line.quantity.milli % 1000 === 0).to.equal(!line.weighted);
      });
    });
    expect([...methods].sort()).to.deep.equal(['bizum', 'card', 'cash', 'mixed']);
    tickets.filter(ticket => ticket.payment.method === 'cash')
      .forEach(ticket => expect(ticket.payment.changeCents).to.be.above(0));
    tickets.filter(ticket => ticket.payment.method === 'mixed').forEach(ticket => {
      expect(ticket.payment.parts).to.have.length(2);
      expect(ticket.payment.changeCents).to.equal(0);
    });
  });

  it('adds up what every ticket sold of each barcode', () => {
    const sold = soldQuantities(tickets);
    expect([...sold.keys()].sort()).to.deep.equal(['1001', '1002']);
    const fideo = tickets.reduce((milli, ticket) => milli + ticket.lines
      .filter(line => line.barcode === '1001')
      .reduce((sum, line) => sum + line.quantity.milli, 0), 0);
    expect(sold.get('1001').milli).to.equal(fideo);
    expect(soldQuantities([])).to.deep.equal(new Map());
  });

  it('repeats the same tickets for the same moment', () => {
    expect(buildDemoOrders(products, now)).to.deep.equal(tickets);
  });

  it('sells nothing when every product is disabled', () => {
    expect(buildDemoOrders([], now)).to.deep.equal([]);
    expect(buildDemoOrders([products[2]], now)).to.deep.equal([]);
  });
});

/**
 * @param {Date} now
 * @param {number} span
 * @returns {Date[]}
 */
function eachDay(now, span) {
  const days = [];
  for (let index = span - 1; index >= 0; index -= 1) {
    days.push(new Date(now.getFullYear(), now.getMonth(), now.getDate() - index));
  }
  return days;
}

/**
 * @param {Date} day
 * @returns {string}
 */
function dayKey(day) {
  return day.getFullYear() + '-' + (day.getMonth() + 1) + '-' + day.getDate();
}
