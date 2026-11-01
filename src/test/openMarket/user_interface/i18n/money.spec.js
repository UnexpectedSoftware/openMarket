import {expect} from 'chai';
import Money from '../../../../openMarket/domain/money/Money';
import {formatEuroCents} from '../../../../openMarket/domain/money/formatEs';
import {formatMoney} from '../../../../openMarket/user_interface/i18n/money';

const euros = new Intl.NumberFormat('es-ES', {
  style: 'currency',
  currency: 'EUR'
});

describe('formatMoney', () => {
  it('formats a price in euros for Spain', () => {
    expect(formatMoney(1.5)).to.equal(euros.format(1.5));
    expect(formatMoney(1234.5)).to.equal(euros.format(1234.5));
    expect(formatMoney(Money.ofCents(115))).to.equal(formatEuroCents(115));
    expect(formatMoney({cents: 90})).to.equal(formatEuroCents(90));
  });

  it('returns an empty string when the amount is not a number', () => {
    expect(formatMoney(undefined)).to.equal('');
    expect(formatMoney('nope')).to.equal('');
    expect(formatMoney(NaN)).to.equal('');
  });
});
