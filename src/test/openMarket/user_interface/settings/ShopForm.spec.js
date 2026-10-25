import {mount} from '../components/mount';
import React from 'react';
import {expect} from 'chai';
import ShopForm from '../../../../openMarket/user_interface/settings/ShopForm';

const FIELDS = [
  ['nif', 'NIF'],
  ['legalName', 'Razón social'],
  ['tradeName', 'Nombre comercial'],
  ['street', 'Calle'],
  ['postalCode', 'Código postal'],
  ['city', 'Ciudad'],
  ['province', 'Provincia'],
  ['country', 'País'],
  ['phone', 'Teléfono'],
  ['email', 'Correo']
];

describe('ShopForm', () => {
  it('ties each label to its input', () => {
    const view = mount(
      <ShopForm
        values={{nif: 'B12345674', phone: '600', email: 'a@b.es', invoicingEnabled: true}}
        fieldErrors={{nif: 'NIF no válido'}}
        onChange={() => {}}
      />
    );
    FIELDS.forEach(([name, label]) => {
      const input = view.node.querySelector('#shop-' + name);
      const caption = view.node.querySelector('label[for="shop-' + name + '"]');
      expect(caption.textContent).to.equal(label);
      expect(input.id).to.equal('shop-' + name);
      expect(input.getAttribute('type')).to.equal('text');
    });
    expect(view.node.querySelector('#shop-phone').getAttribute('inputmode')).to.equal('tel');
    expect(view.node.querySelector('#shop-email').getAttribute('inputmode')).to.equal('email');
    expect(view.node.querySelector('#shop-nif').getAttribute('aria-describedby')).to.equal('shop-nif-error');
    const invoicing = view.node.querySelector('#shop-invoicing');
    const invoicingLabel = view.node.querySelector('label[for="shop-invoicing"]');
    expect(invoicing.getAttribute('type')).to.equal('checkbox');
    expect(invoicing.checked).to.equal(true);
    expect(invoicingLabel.textContent).to.equal('Emitir facturas');
    view.unmount();
  });
});
