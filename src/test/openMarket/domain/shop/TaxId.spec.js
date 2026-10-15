import {expect} from 'chai';
import TaxId from '../../../../openMarket/domain/shop/TaxId';
import ErrorCode from '../../../../openMarket/domain/error/ErrorCode';

describe('TaxId', () => {
  it('accepts a NIF, a NIE, and a CIF, and drops spaces', () => {
    expect(TaxId.parse('12345678Z').value).to.equal('12345678Z');
    expect(TaxId.parse('x1234567l').value).to.equal('X1234567L');
    expect(TaxId.parse('B-12345674').value).to.equal('B12345674');
    expect(TaxId.parse('12345678Z').equals(TaxId.parse('12345678z'))).to.equal(true);
  });

  it('rejects a NIF whose control letter is wrong', () => {
    expect(() => TaxId.parse('12345678A')).to.throw(Error)
      .with.property('code', ErrorCode.TAX_ID_INVALID);
  });
});
