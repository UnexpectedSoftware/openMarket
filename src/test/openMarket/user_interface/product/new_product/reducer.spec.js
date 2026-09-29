import {expect} from 'chai';
import reducer from '../../../../../openMarket/user_interface/product/new_product/reducer';
import {newProductSaved} from '../../../../../openMarket/user_interface/product/new_product/action';

describe('new product reducer', () => {
  const editing = {
    categories: [{id: 'cat-1', name: 'Pasta'}],
    statuses: [{key: 'ENABLED', value: 'Enabled'}],
    initialValues: {barcode: '1001', name: 'Fideo', status: 'ENABLED'},
    edition: true,
    formKey: 2
  };

  it('keeps the open product when an edit is saved', () => {
    expect(reducer(editing, newProductSaved({edition: true}))).to.equal(editing);
  });

  it('clears the form after a new product is saved', () => {
    expect(reducer(editing, newProductSaved())).to.deep.equal({
      categories: [],
      statuses: [],
      initialValues: {},
      edition: false,
      formKey: 3
    });
  });
});
