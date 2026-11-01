import {expect} from 'chai';
import Money from '../../../../openMarket/domain/money/Money';
import {
  formatEuroCents,
  formatQuantityMilli,
  formatTicketWhen
} from '../../../../openMarket/domain/money/formatEs';

describe('Spanish ticket formatting', () => {
  const euros = new Intl.NumberFormat('es-ES', {style: 'currency', currency: 'EUR'});

  it('formats euro cents with a comma and a euro sign', () => {
    expect(formatEuroCents(1313)).to.equal(euros.format(13.13));
    expect(formatEuroCents(0)).to.equal(euros.format(0));
    expect(formatEuroCents(-50)).to.equal(euros.format(Money.ofCents(-50).toEuros()));
    expect(formatEuroCents(1.5)).to.equal(euros.format(0));
    expect(formatEuroCents(null)).to.equal(euros.format(0));
  });

  it('formats a milli quantity with a Spanish comma', () => {
    expect(formatQuantityMilli(350)).to.equal('0,35');
    expect(formatQuantityMilli(2000)).to.equal('2');
    expect(formatQuantityMilli(1000)).to.equal('1');
    expect(formatQuantityMilli(1010)).to.equal('1,01');
    expect(formatQuantityMilli(1100)).to.equal('1,1');
    expect(formatQuantityMilli(1)).to.equal('0,001');
    expect(formatQuantityMilli(-350)).to.equal('-0,35');
    expect(formatQuantityMilli(-2000)).to.equal('-2');
    expect(formatQuantityMilli(1.2)).to.equal('0');
  });

  it('formats the shop date and the issue time', () => {
    expect(formatTicketWhen('2026-11-01', '2026-11-01T23:17:04+01:00')).to.equal('01/11/2026 23:17');
    expect(formatTicketWhen('2026-10-18', '12:00:00')).to.equal('18/10/2026 12:00');
    expect(formatTicketWhen('2026-10-18', '')).to.equal('18/10/2026');
    expect(formatTicketWhen('', '2026-10-18T09:05:00Z')).to.equal('09:05');
    expect(formatTicketWhen('', '')).to.equal('');
    expect(formatTicketWhen(null, null)).to.equal('');
    expect(formatTicketWhen('18/10/2026', 'nope')).to.equal('');
  });
});
