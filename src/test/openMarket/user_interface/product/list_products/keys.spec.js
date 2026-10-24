import {expect} from 'chai';
import {productsKey, wantsSearch} from '../../../../../openMarket/user_interface/product/list_products/keys';

describe('productsKey', () => {
  it('focuses search on slash and leaves the nav keys alone', () => {
    expect(productsKey({key: '/'})).to.deep.equal({type: 'search'});
    expect(productsKey({key: 'F2'})).to.equal(null);
    expect(productsKey({key: 'F3'})).to.equal(null);
    expect(productsKey({key: 'F4'})).to.equal(null);
    expect(productsKey({key: 'Enter'})).to.equal(null);
    expect(productsKey({key: 'Escape'})).to.equal(null);
    expect(productsKey({key: '/', target: {tagName: 'INPUT'}})).to.equal(null);
    expect(productsKey({key: '/', target: {tagName: 'TEXTAREA'}})).to.equal(null);
    expect(productsKey({key: '/', target: {tagName: 'SELECT'}})).to.equal(null);
    expect(productsKey(null)).to.equal(null);
    expect(wantsSearch({key: '/'}, false)).to.equal(true);
    expect(wantsSearch({key: '/'}, true)).to.equal(false);
    expect(wantsSearch({key: 'Enter'}, false)).to.equal(false);
    expect(wantsSearch({key: '/', target: {tagName: 'INPUT'}}, false)).to.equal(false);
  });
});
