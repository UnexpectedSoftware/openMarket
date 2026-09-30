import {expect} from 'chai';
import {formatMoney} from '../../../../openMarket/user_interface/i18n/money';

const euros = new Intl.NumberFormat('es-ES', {
  style: 'currency',
  currency: 'EUR'
});

describe('formatMoney', () => {
  it('formats a price in euros for Spain', () => {
    expect(formatMoney(1.5)).to.equal(euros.format(1.5));
    expect(formatMoney(1234.5)).to.equal(euros.format(1234.5));
  });

  it('returns an empty string when the amount is not a number', () => {
    expect(formatMoney(undefined)).to.equal('');
    expect(formatMoney('nope')).to.equal('');
    expect(formatMoney(NaN)).to.equal('');
  });
});
