import {expect} from 'chai';
import reducer from '../../../../../openMarket/user_interface/product/new_product/reducer';
import {
  FIND_PRODUCT_IMAGE,
  newProductSaved,
  productImageFound,
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
      initialValues: { status: 'ENABLED' },
      edition: false,
      formKey: 3,
      imageLookup: idleLookup,
      lookupGeneration: 5
    });
  });

  it('starts a new product as enabled', () => {
    expect(reducer(undefined, {type: '@@INIT'}).initialValues).to.deep.equal({ status: 'ENABLED' });
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
    expect(opened.edition).to.equal(true);
    expect(opened.initialValues.status).to.equal('DISABLED');
    expect(opened.imageLookup).to.deep.equal(idleLookup);
    expect(opened.lookupGeneration).to.equal(found.lookupGeneration + 1);
  });
});
