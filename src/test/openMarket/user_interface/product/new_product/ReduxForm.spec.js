import React from 'react';
import ReactTestUtils from 'react-dom/test-utils';
import {expect} from 'chai';
import {createStore, combineReducers} from 'redux';
import {Provider} from 'react-redux';
import {reducer as formReducer} from 'redux-form';
import {mount} from '../../components/mount';
import ProductForm from '../../../../../openMarket/user_interface/product/new_product/ReduxForm';

const VALID = {
  name: 'Fideo',
  barcode: '8410000001001',
  price: '1.25',
  basePrice: '0.80',
  vatRate: 'S1:21',
  stock: '10',
  stockMin: '5',
  categoryId: '1',
  status: 'ENABLED'
};

function render(props) {
  const store = createStore(combineReducers({form: formReducer}));
  const submitted = [];
  const view = mount(
    <Provider store={store}>
      <ProductForm onSubmit={values => submitted.push(values)} {...props} />
    </Provider>
  );
  const submit = () => ReactTestUtils.Simulate.submit(view.node.querySelector('form'));
  return {view, submitted, submit};
}

function errors(node) {
  return [...node.querySelectorAll('.om-field__error, .om-field-error, [role="alert"]')].map(item => item.textContent);
}

describe('Product form', () => {
  it('refuses a name or a barcode made only of spaces', () => {
    const {view, submitted, submit} = render({initialValues: {...VALID, name: '   ', barcode: ' '}});
    try {
      submit();
      expect(submitted).to.deep.equal([]);
      expect(view.node.textContent).to.contain('Required');
    } finally {
      view.unmount();
    }
  });

  it('sends a complete product with its category picture and status labels', () => {
    const {view, submitted, submit} = render({
      initialValues: VALID,
      categoryId: '1',
      categoriesList: [{id: '1', name: 'Despensa', imageSrc: 'data:image/png;base64,AA=='}],
      statusesList: [{key: 'ENABLED', value: 'Enabled'}, {key: 'OTHER', value: 'Other'}],
      imageLookup: {busy: true}
    });
    try {
      expect(view.node.querySelector('.product-category-row img').getAttribute('src')).to.equal('data:image/png;base64,AA==');
      expect(view.node.textContent).to.contain('Looking…');
      expect(view.node.textContent).to.contain('Other');
      submit();
      expect(submitted).to.have.length(1);
      expect(submitted[0]).to.include({name: 'Fideo', barcode: '8410000001001'});
      expect(errors(view.node)).to.deep.equal([]);
    } finally {
      view.unmount();
    }
  });

  it('hides the image search while editing and falls back to the placeholder picture', () => {
    const {view} = render({edition: true, initialValues: VALID});
    try {
      expect(view.node.querySelector('.product-image-lookup')).to.equal(null);
      expect(view.node.querySelector('input[name="barcode"]').readOnly).to.equal(true);
      expect(view.node.querySelector('.product-category-row img').getAttribute('src')).to.not.equal('');
    } finally {
      view.unmount();
    }
  });
});
