import {expect} from 'chai';
import ProductsQuery from '../../../../openMarket/domain/product/ProductsQuery';

describe('ProductsQuery', () => {
  it('does not throw on an empty object and freezes the defaults', () => {
    const query = new ProductsQuery({});
    expect(Object.isFrozen(query)).to.equal(true);
    expect(query.text).to.equal(null);
    expect(query.categoryId).to.equal(null);
    expect(query.status).to.equal(null);
    expect(query.weighted).to.equal(null);
    expect(query.lowStock).to.equal(false);
    expect(query.sort).to.equal('name_asc');
    expect(query.limit).to.equal(undefined);
    expect(query.offset).to.equal(0);
    expect(query.forSale).to.equal(false);
    expect(() => {
      query.sort = 'stock_desc';
    }).to.throw(TypeError);
    expect(query.sort).to.equal('name_asc');
  });

  it('accepts a missing argument', () => {
    const query = new ProductsQuery();
    expect(query.sort).to.equal('name_asc');
    expect(query.offset).to.equal(0);
    expect(query.forSale).to.equal(false);
  });

  it('keeps a provided page and treats blank text as absent', () => {
    const query = new ProductsQuery({
      text: '',
      categoryId: '',
      status: '',
      weighted: false,
      lowStock: 0,
      sort: '',
      limit: 20,
      offset: 0,
      forSale: 0
    });
    expect(query.text).to.equal(null);
    expect(query.categoryId).to.equal(null);
    expect(query.status).to.equal(null);
    expect(query.weighted).to.equal(false);
    expect(query.lowStock).to.equal(false);
    expect(query.sort).to.equal('name_asc');
    expect(query.limit).to.equal(20);
    expect(query.offset).to.equal(0);
    expect(query.forSale).to.equal(false);
  });

  it('stores a sell-grid query', () => {
    const query = new ProductsQuery({
      text: 'mi',
      categoryId: 'dairy',
      status: 'DISABLED',
      weighted: 1,
      lowStock: 1,
      sort: 'stock_desc',
      limit: 24,
      offset: 20,
      forSale: true
    });
    expect(query.text).to.equal('mi');
    expect(query.categoryId).to.equal('dairy');
    expect(query.status).to.equal('DISABLED');
    expect(query.weighted).to.equal(true);
    expect(query.lowStock).to.equal(true);
    expect(query.sort).to.equal('stock_desc');
    expect(query.limit).to.equal(24);
    expect(query.offset).to.equal(20);
    expect(query.forSale).to.equal(true);
  });
});
