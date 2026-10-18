import {installDom} from '../../components/domSetup';
import React from 'react';
import ReactDOM from 'react-dom';
import {expect} from 'chai';
import Cart from '../../../../../openMarket/user_interface/order/new_order/Cart';
import Money from '../../../../../openMarket/domain/money/Money';
import Quantity from '../../../../../openMarket/domain/money/Quantity';
import VatRate from '../../../../../openMarket/domain/tax/VatRate';

describe('Cart', () => {
  let host;

  beforeEach(() => {
    installDom();
    host = document.createElement('div');
    document.body.appendChild(host);
  });

  afterEach(() => {
    ReactDOM.unmountComponentAtNode(host);
    if (host.parentNode) {
      host.parentNode.removeChild(host);
    }
  });

  it('highlights an invalid quantity and disables Cobrar', () => {
    ReactDOM.render(
      <Cart
        order={{
          lines: [{
            kind: 'PRODUCT',
            barcode: '1',
            name: 'Milk',
            unitPrice: Money.from(2),
            quantity: Quantity.from(0),
            vatRate: VatRate.standard(),
            weighted: false
          }],
          total: Money.ofCents(0)
        }}
      />,
      host
    );

    const row = host.querySelector('.sell-line');
    expect(row.getAttribute('aria-invalid')).to.equal('true');
    expect(host.textContent).to.contain('Cantidad no válida');
    const charge = Array.prototype.find.call(
      host.querySelectorAll('button'),
      button => button.textContent.indexOf('Cobrar') !== -1
    );
    expect(charge.disabled).to.equal(true);
  });
});
