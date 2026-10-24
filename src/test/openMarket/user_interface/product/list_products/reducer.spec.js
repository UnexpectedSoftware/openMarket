import {expect} from 'chai';
import reducer from '../../../../../openMarket/user_interface/product/list_products/reducer';
import {
  listProductsDisabled,
  listProductsFetch,
  productsArchive,
  productsArchived,
  productsArchiveDismissed,
  productsArchivePrompted,
  productsCategoriesLoaded,
  productsDetailLoaded,
  productsDraftChanged,
  productsDrawerClosed,
  productsDrawerFailed,
  productsDrawerOpened,
  productsFailed,
  productsFiltersChanged,
  productsImageFound,
  productsImageMissed,
  productsImageRequested,
  productsLoaded,
  productsPageChanged,
  productsPageOpened,
  productsQueryChanged,
  productsSave,
  productsSaved,
  productsSaveFailed
} from '../../../../../openMarket/user_interface/product/list_products/action';
import {emptyDraft, state} from '../../../../../openMarket/user_interface/product/list_products/model';

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

  it('walks the drawer from open to save, archive, and image lookup', () => {
    expect(reducer(undefined, {type: 'UNKNOWN'}).drawerOpen).to.equal(false);
    const searched = reducer(state(), productsQueryChanged('leche'));
    expect(searched.query).to.equal('leche');
    const filtered = reducer(searched, productsFiltersChanged({status: 'ENABLED', sort: 'name_desc'}));
    expect(filtered.sort).to.equal('name_desc');
    expect(reducer(filtered, productsPageChanged({offset: 20})).offset).to.equal(20);
    expect(reducer(state(), productsCategoriesLoaded([{id: 'a', name: 'A'}])).categories).to.have.length(1);

    let current = reducer(state(), productsDrawerOpened({mode: 'edit', barcode: '0001'}));
    expect(current.loadingDraft).to.equal(true);
    current = reducer(current, productsDetailLoaded({
      barcode: '0001',
      draft: {...emptyDraft(), barcode: '0001', name: 'Milk'}
    }));
    expect(current.draft.name).to.equal('Milk');
    current = reducer(current, productsDraftChanged({field: 'name', value: 'Leche'}));
    expect(current.draft.name).to.equal('Leche');
    current = reducer(current, productsSave());
    expect(current.saving).to.equal(false);
    current = reducer(current, productsSaveFailed({message: 'no'}));
    expect(current.formError).to.equal('no');
    current = reducer(current, productsArchivePrompted());
    expect(current.confirmArchive).to.equal(true);
    current = reducer(current, productsArchiveDismissed());
    expect(current.confirmArchive).to.equal(false);
    current = reducer(current, productsArchive());
    expect(current.saving).to.equal(true);
    current = reducer(current, productsArchived('0001'));
    expect(current.drawerOpen).to.equal(false);

    current = reducer(state(), productsDrawerOpened({mode: 'create'}));
    current = reducer(current, productsImageRequested());
    expect(current.imageLookupBusy).to.equal(true);
    current = reducer(current, productsImageFound({imagePath: '/tmp/a', imageUrl: 'data:a'}));
    expect(current.draft.imagePath).to.equal('/tmp/a');
    current = reducer(current, productsImageMissed('miss'));
    expect(current.formError).to.equal('miss');
    expect(reducer(current, productsDrawerFailed({barcode: 'nope'})).formError).to.equal('miss');
    expect(reducer(current, productsSaved()).loading).to.equal(true);
    expect(reducer(current, productsDrawerClosed()).drawerOpen).to.equal(false);
  });
});
