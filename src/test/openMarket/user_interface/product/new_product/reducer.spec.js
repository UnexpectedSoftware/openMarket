import {expect} from 'chai';
import reducer from '../../../../../openMarket/user_interface/product/new_product/reducer';
import {
  FIND_PRODUCT_IMAGE,
  newProductFetchedCategories,
  newProductSaved,
  productClose,
  productFetchedStatuses,
  productImageFound,
  productPageLoaded,
  productSalesLoaded,
  productSalesWindowSelected,
  PRODUCT_IMAGE_LOOKUP_FINISHED
} from '../../../../../openMarket/user_interface/product/new_product/action';
import {LIST_PRODUCTS_DETAIL_LOADED} from '../../../../../openMarket/user_interface/product/list_products/action';

const idleLookup = { busy: false, imagePath: null, imageSrc: null };

describe('new product reducer', () => {
  const editing = {
    categories: [{id: 'cat-1', name: 'Pasta'}],
    statuses: [{key: 'ENABLED', value: 'Enabled'}],
    initialValues: {barcode: '1001', name: 'Fideo', status: 'ENABLED'},
    edition: true,
    formKey: 2,
    imageLookup: idleLookup,
    lookupGeneration: 4
  };

  it('keeps the open product when an edit is saved', () => {
    expect(reducer(editing, newProductSaved({edition: true}))).to.equal(editing);
  });

  it('clears the form after a new product is saved', () => {
    expect(reducer(editing, newProductSaved())).to.deep.equal({
      categories: [],
      statuses: [],
      initialValues: { status: 'ENABLED', vatRate: 'S1:21' },
      edition: false,
      formKey: 3,
      imageLookup: idleLookup,
      lookupGeneration: 5,
      sales: {
        window: 'last_7_days',
        quantity: 0,
        amount: 0,
        series: []
      }
    });
  });

  it('starts a new product as enabled', () => {
    expect(reducer(undefined, {type: '@@INIT'}).initialValues).to.deep.equal({
      status: 'ENABLED',
      vatRate: 'S1:21'
    });
  });

  it('stores a found image and drops it when an existing product is opened', () => {
    const started = reducer(undefined, {type: FIND_PRODUCT_IMAGE, barcode: '5449000131805'});
    expect(started.imageLookup.busy).to.equal(true);
    const found = reducer(started, productImageFound({
      imagePath: '/tmp/openfoodfacts-a.jpg',
      imageSrc: 'data:image/jpeg;base64,aa'
    }));
    expect(found.imageLookup).to.deep.equal({
      busy: false,
      imagePath: '/tmp/openfoodfacts-a.jpg',
      imageSrc: 'data:image/jpeg;base64,aa'
    });
    const missed = reducer(found, {type: PRODUCT_IMAGE_LOOKUP_FINISHED});
    expect(missed.imageLookup).to.deep.equal(found.imageLookup);
    const opened = reducer(found, {
      type: LIST_PRODUCTS_DETAIL_LOADED,
      payload: {barcode: '1001', status: 'DISABLED'}
    });
    expect(opened).to.equal(found);
  });

  it('keeps the loaded series when the window changes until the next result arrives', () => {
    const loaded = reducer(undefined, productSalesLoaded({
      window: 'year',
      quantity: 4,
      amount: 8,
      series: [{soldOn: '2026-01', quantity: 4, amount: 8}]
    }));
    const selected = reducer(loaded, productSalesWindowSelected({barcode: '1001', window: 'day'}));
    expect(selected.sales.window).to.equal('day');
    expect(selected.sales.quantity).to.equal(4);
    const opened = reducer(selected, {
      type: LIST_PRODUCTS_DETAIL_LOADED,
      payload: {barcode: '1002'}
    });
    expect(opened).to.equal(selected);
  });

  it('stores categories and statuses and resets when the page closes', () => {
    const withLists = reducer(undefined, newProductFetchedCategories([{id: 'a', name: 'A'}]));
    expect(withLists.categories).to.deep.equal([{id: 'a', name: 'A'}]);
    const withStatuses = reducer(withLists, productFetchedStatuses([{key: 'ENABLED'}]));
    expect(withStatuses.statuses).to.deep.equal([{key: 'ENABLED'}]);
    const closed = reducer(withStatuses, productClose());
    expect(closed.categories).to.deep.equal([]);
    expect(closed.formKey).to.equal(0);
    const reloaded = reducer({...withStatuses, lookupGeneration: 0, sales: null, imageLookup: null}, productPageLoaded());
    expect(reloaded.formKey).to.equal(0);
    expect(reloaded.lookupGeneration).to.equal(1);
    const started = reducer({imageLookup: null}, {type: FIND_PRODUCT_IMAGE});
    expect(started.imageLookup.busy).to.equal(true);
    const finished = reducer(started, {type: PRODUCT_IMAGE_LOOKUP_FINISHED});
    expect(finished.imageLookup.busy).to.equal(false);
    const windowOnly = reducer({sales: null}, productSalesWindowSelected({barcode: '1', window: 'day'}));
    expect(windowOnly.sales.window).to.equal('day');
    expect(windowOnly.sales.quantity).to.equal(0);
  });
});
