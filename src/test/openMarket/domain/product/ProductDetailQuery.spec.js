import {expect} from 'chai';
import ProductDetailQuery from '../../../../openMarket/domain/product/ProductDetailQuery';

describe('ProductDetailQuery', () => {
  it('accepts an empty object and freezes a null barcode', () => {
    const query = new ProductDetailQuery();
    expect(query.barcode).to.equal(null);
    expect(Object.isFrozen(query)).to.equal(true);
  });

  it('keeps a missing barcode null and stringifies a present one', () => {
    expect(new ProductDetailQuery({}).barcode).to.equal(null);
    expect(new ProductDetailQuery({barcode: null}).barcode).to.equal(null);
    expect(new ProductDetailQuery({barcode: 8400000000011}).barcode).to.equal('8400000000011');
    expect(new ProductDetailQuery({barcode: ''}).barcode).to.equal('');
  });
});
