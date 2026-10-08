import {expect} from 'chai';
import reducer from '../../../../../openMarket/user_interface/product/list_products/reducer';
import {listProductsDisabled, listProductsFetched} from '../../../../../openMarket/user_interface/product/list_products/action';
import {state} from '../../../../../openMarket/user_interface/product/list_products/model';

function card(barcode, status) {
  return {
    barcode,
    name: barcode,
    price: 1,
    stock: 1,
    status,
    categoryName: 'Drinks',
    imageSrc: null
  };
}

function fetched(extra) {
  return listProductsFetched({
    query: '',
    lowStock: false,
    status: null,
    categoryId: null,
    products: [],
    hasMore: false,
    nextCursor: null,
    append: false,
    ...extra
  });
}

describe('product catalog reducer', () => {
  it('ignores a result from an older search', () => {
    const current = {...state(), query: 'cola'};
    expect(reducer(current, fetched({query: 'co', products: [card('0001', 'ENABLED')]}))).to.equal(current);
  });

  it('ignores a result from an older filter', () => {
    const current = {...state(), lowStock: true};
    expect(reducer(current, fetched({products: [card('0001', 'ENABLED')]}))).to.equal(current);
  });

  it('appends the next page and skips a barcode already shown', () => {
    const current = {
      ...state(),
      products: [card('0001', 'ENABLED')],
      nextCursor: {rank: 0, barcode: '0001'},
      hasMore: true
    };
    const next = reducer(current, fetched({
      products: [card('0001', 'ENABLED'), card('0002', 'ENABLED')],
      append: true
    }));
    expect(next.products.map(product => product.barcode)).to.deep.equal(['0001', '0002']);
    expect(next.nextCursor).to.equal(null);
    expect(next.hasMore).to.equal(false);
  });

  it('moves a disabled product below enabled ones and keeps the cursor', () => {
    const cursor = {rank: 1, barcode: '0003'};
    const current = {
      ...state(),
      products: [card('0001', 'ENABLED'), card('0002', 'ENABLED'), card('0003', 'DISABLED')],
      nextCursor: cursor,
      hasMore: true
    };
    const next = reducer(current, listProductsDisabled('0001'));
    expect(next.products.map(product => product.barcode)).to.deep.equal(['0002', '0001', '0003']);
    expect(next.products[1].status).to.equal('DISABLED');
    expect(next.nextCursor).to.equal(cursor);
  });

  it('keeps a disabled product on the list when the disabled filter is on', () => {
    const cursor = {rank: 1, barcode: '0002'};
    const current = {
      ...state(),
      status: 'DISABLED',
      products: [card('0001', 'ENABLED'), card('0002', 'DISABLED')],
      nextCursor: cursor
    };
    const next = reducer(current, listProductsDisabled('0001'));
    expect(next.products.map(product => product.barcode)).to.deep.equal(['0001', '0002']);
    expect(next.products[0].status).to.equal('DISABLED');
    expect(next.nextCursor).to.equal(cursor);
  });
});
