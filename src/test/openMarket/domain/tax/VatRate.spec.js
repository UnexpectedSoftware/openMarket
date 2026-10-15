import {expect} from 'chai';
import VatRate from '../../../../openMarket/domain/tax/VatRate';
import InvalidVatRateError from '../../../../openMarket/domain/tax/InvalidVatRateError';
import ErrorCode from '../../../../openMarket/domain/error/ErrorCode';

describe('VatRate', () => {
  it('accepts the taxed percents and rejects the rest', () => {
    [21, 10, 5, 4, 2, 0].forEach(percent => {
      const rate = VatRate.of({kind: 'S1', percent});
      expect(rate.percent).to.equal(percent);
      expect(rate.cause).to.equal(null);
      expect(rate.code()).to.equal('S1:' + percent);
    });
    expect(() => VatRate.of({kind: 'S1', percent: 7})).to.throw(InvalidVatRateError);
    expect(() => VatRate.of({kind: 'S1', percent: 21, cause: 'E1'})).to.throw(InvalidVatRateError);
  });

  it('requires an exemption cause and rejects a taxed exempt line', () => {
    const exempt = VatRate.of({kind: 'E', percent: 0, cause: 'E1'});
    expect(exempt.code()).to.equal('E:0:E1');
    expect(() => VatRate.of({kind: 'E', percent: 0})).to.throw(InvalidVatRateError);
    expect(() => VatRate.of({kind: 'E', percent: 21, cause: 'E1'})).to.throw(InvalidVatRateError);
    try {
      VatRate.of({kind: 'E', percent: 0});
    } catch (error) {
      expect(error.code).to.equal(ErrorCode.VAT_RATE_INVALID);
    }
  });

  it('accepts a not-subject cause', () => {
    expect(VatRate.of({kind: 'N', cause: 'N2'}).key()).to.equal('N:0:N2');
    expect(() => VatRate.of({kind: 'N', cause: 'E1'})).to.throw(InvalidVatRateError);
  });

  it('round-trips a code and compares by key', () => {
    const rate = VatRate.fromCode('S1:10');
    expect(rate.equals(VatRate.of({percent: 10}))).to.equal(true);
    expect(rate.toJSON()).to.deep.equal({kind: 'S1', percent: 10, cause: null});
  });
});
