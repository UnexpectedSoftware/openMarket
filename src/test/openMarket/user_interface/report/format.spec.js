import {expect} from 'chai';
import Money from '../../../../openMarket/domain/money/Money';
import {formatMoney} from '../../../../openMarket/user_interface/i18n/money';
import {
  axisLabels,
  formatBucketRange,
  formatBucketTooltip,
  formatSalesGap
} from '../../../../openMarket/user_interface/report/format';

/**
 * @param {string} from
 * @param {string} [to]
 */
function bucket(from, to) {
  return {from, to: to || from, cashCents: 0, cardCents: 0, bizumCents: 0, previousTotalCents: 0};
}

/**
 * @param {string} start
 * @param {number} count
 * @returns {Array<{from: string, to: string}>}
 */
function daysFrom(start, count) {
  const cursor = new Date(Number(start.slice(0, 4)), Number(start.slice(5, 7)) - 1, Number(start.slice(8, 10)));
  const buckets = [];
  for (let index = 0; index < count; index += 1) {
    const iso = cursor.getFullYear() + '-'
      + String(cursor.getMonth() + 1).padStart(2, '0') + '-'
      + String(cursor.getDate()).padStart(2, '0');
    buckets.push(bucket(iso));
    cursor.setDate(cursor.getDate() + 1);
  }
  return buckets;
}

describe('report chart labels', () => {
  it('formats a week inside one month, a week across months, and a month', () => {
    expect(formatBucketRange(bucket('2026-11-03', '2026-11-09'), 'week')).to.equal('3–9 nov');
    expect(formatBucketRange(bucket('2026-09-28', '2026-10-04'), 'week')).to.equal('28 sep – 4 oct');
    expect(formatBucketRange(bucket('2026-12-28', '2027-01-03'), 'week')).to.equal('28 dic 2026 – 3 ene 2027');
    expect(formatBucketRange(bucket('2026-11-01', '2026-11-30'), 'month')).to.equal('nov 2026');
  });

  it('puts the month on the first day and on each month change', () => {
    const labels = axisLabels(daysFrom('2026-10-28', 6), 'day');
    expect(labels).to.deep.equal(['28 oct', '29', '30', '31', '1 nov', '2']);
  });

  it('leaves gaps between labels when the days would crowd', () => {
    const days = daysFrom('2026-10-01', 45);
    const labels = axisLabels(days, 'day');
    const shown = labels.reduce((indexes, label, index) => {
      if (label) {
        indexes.push(index);
      }
      return indexes;
    }, []);
    expect(labels[0]).to.equal('1 oct');
    expect(labels[31]).to.equal('1 nov');
    expect(shown.length).to.be.below(labels.length);
    shown.slice(1).forEach((index, position) => {
      expect(index - shown[position]).to.be.at.least(5);
    });
  });

  it('thins week labels but keeps the first week of a month', () => {
    const weeks = [
      bucket('2026-09-28', '2026-10-04'),
      bucket('2026-10-05', '2026-10-11'),
      bucket('2026-10-12', '2026-10-18'),
      bucket('2026-10-19', '2026-10-25'),
      bucket('2026-10-26', '2026-11-01'),
      bucket('2026-11-02', '2026-11-08'),
      bucket('2026-11-09', '2026-11-15')
    ];
    const labels = axisLabels(weeks, 'week');
    expect(labels[0]).to.equal('28 sep – 4 oct');
    expect(labels[4]).to.equal('26 oct – 1 nov');
    expect(labels.filter(Boolean).length).to.be.below(weeks.length);
  });

  it('describes the trimmed edges and the methods in the tooltip', () => {
    expect(formatSalesGap({firstSale: '2026-09-28', lastSale: null})).to.equal('Sin ventas antes del 28 sep');
    expect(formatSalesGap({firstSale: null, lastSale: '2026-11-11'})).to.equal('Sin ventas después del 11 nov');
    expect(formatSalesGap({firstSale: '2026-09-28', lastSale: '2026-11-11'}))
      .to.equal('Sin ventas antes del 28 sep ni después del 11 nov');
    expect(formatSalesGap({})).to.equal('');
    const tip = formatBucketTooltip({
      from: '2026-11-03',
      to: '2026-11-09',
      cashCents: 1250,
      cardCents: 0,
      bizumCents: 5
    }, 'week');
    expect(tip).to.equal(
      '3–9 nov · Efectivo ' + formatMoney(Money.ofCents(1250))
      + ' · Tarjeta ' + formatMoney(Money.ofCents(0))
      + ' · Bizum ' + formatMoney(Money.ofCents(5))
    );
  });
});
