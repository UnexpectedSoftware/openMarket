import {expect} from 'chai';
import moment from 'moment';
import {bucketSales, eachDay} from '../../../../../openMarket/application/service/report/reportPeriod';

const DAY = 'YYYY-MM-DD';

/**
 * @param {string} start
 * @param {number} days
 * @returns {{from: string, to: string, end: string}}
 */
function span(start, days) {
  const end = moment(start, DAY).add(days - 1, 'day').format(DAY);
  return {from: start + ' 00:00:00', to: end + ' 23:59:59', end};
}

/**
 * @param {string} start
 * @param {number} days
 * @param {Array<{soldOn: string, cashCents: number, cardCents: number, bizumCents: number}>} [currentDays]
 * @param {Array<{cashCents: number, cardCents: number, bizumCents: number}>} [previousDays]
 */
function chart(start, days, currentDays, previousDays) {
  const range = span(start, days);
  return bucketSales({
    from: range.from,
    to: range.to,
    currentDays: currentDays || [],
    previousDays: previousDays || []
  });
}

/**
 * @param {string} soldOn
 * @param {number} cashCents
 * @param {number} [cardCents]
 * @param {number} [bizumCents]
 */
function paid(soldOn, cashCents, cardCents, bizumCents) {
  return {
    soldOn,
    cashCents,
    cardCents: cardCents || 0,
    bizumCents: bizumCents || 0
  };
}

describe('bucketSales', () => {
  it('uses days through 45, weeks through 180, and months after that', () => {
    expect(eachDay(span('2026-08-01', 45))).to.have.length(45);
    expect(eachDay(span('2026-08-01', 46))).to.have.length(46);
    expect(eachDay(span('2026-01-01', 180))).to.have.length(180);
    expect(eachDay(span('2026-01-01', 181))).to.have.length(181);
    expect(chart('2026-08-01', 45).grain).to.equal('day');
    expect(chart('2026-08-01', 46).grain).to.equal('week');
    expect(chart('2026-01-01', 180).grain).to.equal('week');
    expect(chart('2026-01-01', 181).grain).to.equal('month');
  });

  it('returns no buckets when the range has no sales', () => {
    const view = chart('2026-11-01', 10);
    expect(view.buckets).to.deep.equal([]);
    expect(view.firstSale).to.equal(null);
    expect(view.lastSale).to.equal(null);
    expect(view.grain).to.equal('day');
  });

  it('keeps empty days between the first and last sale', () => {
    const view = chart('2026-11-01', 5, [
      paid('2026-11-01', 100),
      paid('2026-11-05', 0, 0, 40)
    ]);
    expect(view.buckets.map(bucket => bucket.from)).to.deep.equal([
      '2026-11-01',
      '2026-11-02',
      '2026-11-03',
      '2026-11-04',
      '2026-11-05'
    ]);
    expect(view.buckets[0].cashCents).to.equal(100);
    expect(view.buckets[2].cashCents).to.equal(0);
    expect(view.buckets[4].bizumCents).to.equal(40);
    expect(view.firstSale).to.equal(null);
    expect(view.lastSale).to.equal(null);
  });

  it('drops empty buckets before the first sale and after the last', () => {
    const view = chart('2026-11-01', 10, [paid('2026-11-04', 8)]);
    expect(view.buckets).to.deep.equal([{
      from: '2026-11-04',
      to: '2026-11-04',
      cashCents: 8,
      cardCents: 0,
      bizumCents: 0,
      previousTotalCents: 0
    }]);
    expect(view.firstSale).to.equal('2026-11-04');
    expect(view.lastSale).to.equal('2026-11-04');
  });

  it('trims only the trailing edge when sales start on the first day', () => {
    const view = chart('2026-11-01', 6, [
      paid('2026-11-01', 10),
      paid('2026-11-03', 4)
    ]);
    expect(view.buckets).to.have.length(3);
    expect(view.firstSale).to.equal(null);
    expect(view.lastSale).to.equal('2026-11-03');
  });

  it('keeps previous totals on the same day index, in cents', () => {
    const view = bucketSales({
      from: '2026-11-01 00:00:00',
      to: '2026-11-03 23:59:59',
      currentDays: [paid('2026-11-01', 10), paid('2026-11-03', 10)],
      previousDays: [
        {cashCents: 100, cardCents: 1, bizumCents: 0},
        {cashCents: 40, cardCents: 0, bizumCents: 2}
      ]
    });
    expect(view.buckets[0].previousTotalCents).to.equal(101);
    expect(view.buckets[1].previousTotalCents).to.equal(42);
    expect(view.buckets[2].previousTotalCents).to.equal(0);
  });

  it('starts weeks on Monday and sums the previous cents inside the week', () => {
    const end = span('2026-08-03', 46).end;
    const view = bucketSales({
      from: '2026-08-03 00:00:00',
      to: end + ' 23:59:59',
      currentDays: [paid('2026-08-03', 1), paid(end, 1)],
      previousDays: [
        {cashCents: 100, cardCents: 0, bizumCents: 0},
        {cashCents: 50, cardCents: 25, bizumCents: 0}
      ]
    });
    expect(view.grain).to.equal('week');
    expect(view.buckets[0].from).to.equal('2026-08-03');
    expect(view.buckets[0].to).to.equal('2026-08-09');
    expect(view.buckets[0].previousTotalCents).to.equal(175);
    expect(view.firstSale).to.equal(null);
    expect(view.lastSale).to.equal(null);
  });

  it('keeps a Sunday in the week that started the previous Monday', () => {
    const view = chart('2026-09-25', 46, [
      paid('2026-11-08', 100),
      paid('2026-11-09', 0, 200)
    ]);
    expect(view.grain).to.equal('week');
    const sunday = view.buckets.find(bucket => bucket.to === '2026-11-08');
    const monday = view.buckets.find(bucket => bucket.from === '2026-11-09');
    expect(sunday.from).to.equal('2026-11-02');
    expect(sunday.cashCents).to.equal(100);
    expect(monday.to).to.equal('2026-11-09');
    expect(monday.cardCents).to.equal(200);
    expect(view.firstSale).to.equal('2026-11-08');
    expect(view.lastSale).to.equal(null);
  });

  it('clips a week to the first day of the range', () => {
    const end = span('2026-08-05', 46).end;
    const view = chart('2026-08-05', 46, [paid('2026-08-05', 10), paid(end, 10)]);
    expect(view.grain).to.equal('week');
    expect(view.buckets[0].from).to.equal('2026-08-05');
    expect(view.buckets[0].to).to.equal('2026-08-09');
    expect(view.firstSale).to.equal(null);
  });

  it('splits on the month boundary and sums integer cents', () => {
    const end = span('2026-01-01', 181).end;
    const view = chart('2026-01-01', 181, [
      paid('2026-01-15', 60),
      paid('2026-01-31', 0, 40, 15),
      paid('2026-02-01', 0, 50),
      paid(end, 7)
    ]);
    expect(view.grain).to.equal('month');
    expect(view.buckets[0]).to.include({
      from: '2026-01-01',
      to: '2026-01-31',
      cashCents: 60,
      cardCents: 40,
      bizumCents: 15
    });
    expect(view.buckets[1].from).to.equal('2026-02-01');
    expect(view.buckets[1].to).to.equal('2026-02-28');
    expect(view.buckets[1].cardCents).to.equal(50);
    expect(view.buckets[1].cashCents).to.equal(0);
    expect(view.buckets[view.buckets.length - 1].to).to.equal(end);
    expect(view.buckets[view.buckets.length - 1].cashCents).to.equal(7);
    expect(view.buckets.some(bucket => bucket.cashCents + bucket.cardCents + bucket.bizumCents === 0)).to.equal(true);
    expect(view.firstSale).to.equal(null);
    expect(view.lastSale).to.equal(null);
  });
});
