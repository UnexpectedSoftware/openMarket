import {expect} from 'chai';
import reducer from '../../../../../openMarket/user_interface/product/list_products/reducer';
import {
  listProductsDisabled,
  listProductsFetch,
  productsFailed,
  productsLoaded,
  productsPageOpened
} from '../../../../../openMarket/user_interface/product/list_products/action';
import {state} from '../../../../../openMarket/user_interface/product/list_products/model';

function loaded(extra) {
  return productsLoaded({
    query: '',
    lowStock: false,
    status: null,
    categoryId: null,
    weighted: null,
    sort: 'name_asc',
    offset: 0,
    items: [{barcode: '0001', status: 'ENABLED'}],
    total: 1,
    ...extra
  });
}

describe('products list reducer', () => {
  it('starts a page load from the route', () => {
    const next = reducer(state(), productsPageOpened({lowStock: true}));
    expect(next.lowStock).to.equal(true);
    expect(next.loading).to.equal(true);
    expect(next.items).to.deep.equal([]);
  });

  it('ignores a result from an older search', () => {
    const current = {...state(), query: 'cola'};
    expect(reducer(current, loaded({query: 'co'}))).to.equal(current);
  });

  it('stores the matching page and a failure', () => {
    const next = reducer(state(), loaded({}));
    expect(next.items.map(item => item.barcode)).to.deep.equal(['0001']);
    expect(next.total).to.equal(1);
    expect(next.loading).to.equal(false);
    const failed = reducer(next, productsFailed({
      query: '',
      message: 'No se han podido cargar los productos'
    }));
    expect(failed.error).to.equal('No se han podido cargar los productos');
    expect(failed.loading).to.equal(false);
  });

  it('marks a photo refresh as loading and keeps a disabled row in place', () => {
    const current = {
      ...state(),
      items: [{barcode: '0001', status: 'ENABLED'}, {barcode: '0002', status: 'DISABLED'}],
      total: 2
    };
    expect(reducer(current, listProductsFetch()).loading).to.equal(true);
    const disabled = reducer(current, listProductsDisabled('0001'));
    expect(disabled.items.map(item => item.status)).to.deep.equal(['DISABLED', 'DISABLED']);
    expect(disabled.total).to.equal(2);
  });
});
