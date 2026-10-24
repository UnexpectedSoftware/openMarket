import {expect} from 'chai';
import CategoriesQuery from '../../../../openMarket/domain/category/CategoriesQuery';

describe('CategoriesQuery', () => {
  it('does not throw on an empty object and freezes the defaults', () => {
    const query = new CategoriesQuery({});
    expect(Object.isFrozen(query)).to.equal(true);
    expect(query.text).to.equal(null);
    expect(query.sort).to.equal('name_asc');
    expect(query.limit).to.equal(undefined);
    expect(query.offset).to.equal(0);
    expect(() => {
      query.offset = 1;
    }).to.throw(TypeError);
    expect(query.offset).to.equal(0);
  });

  it('accepts a missing argument', () => {
    const query = new CategoriesQuery();
    expect(query.text).to.equal(null);
    expect(query.sort).to.equal('name_asc');
    expect(query.limit).to.equal(undefined);
    expect(query.offset).to.equal(0);
  });

  it('stores a blank text as null and a blank sort as name order', () => {
    const query = new CategoriesQuery({text: '', sort: '', limit: 0, offset: 0});
    expect(query.text).to.equal(null);
    expect(query.sort).to.equal('name_asc');
    expect(query.limit).to.equal(0);
    expect(query.offset).to.equal(0);
  });

  it('stores a name, another sort, and a page', () => {
    const query = new CategoriesQuery({text: 'Dairy', sort: 'stock_desc', limit: 10, offset: 5});
    expect(query.text).to.equal('Dairy');
    expect(query.sort).to.equal('stock_desc');
    expect(query.limit).to.equal(10);
    expect(query.offset).to.equal(5);
  });
});
