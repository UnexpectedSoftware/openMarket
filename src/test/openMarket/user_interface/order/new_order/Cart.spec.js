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

  it('edits a counted line, a weighed line, and a free line', () => {
    const calls = [];
    const order = {
      lines: [
        {
          kind: 'PRODUCT',
          barcode: 'milk',
          name: 'Milk',
          unitPrice: Money.from(2),
          quantity: Quantity.from(1),
          vatRate: VatRate.standard(),
          weighted: false,
          lowStock: true,
          stock: 2
        },
        {
          kind: 'PRODUCT',
          barcode: 'ham',
          name: 'Ham',
          unitPrice: Money.from(18.5),
          quantity: Quantity.from(0.35),
          vatRate: VatRate.standard(),
          weighted: true
        },
        {
          kind: 'FREE',
          barcode: '',
          name: 'Bolsa',
          unitPrice: Money.from(0.5),
          quantity: Quantity.from(1),
          vatRate: VatRate.standard(),
          weighted: false
        }
      ],
      total: Money.ofCents(698)
    };
    ReactDOM.render(
      <Cart
        order={order}
        selected={0}
        lowStockBarcodes={['milk']}
        onSelect={index => calls.push(['select', index])}
        onQuantityChange={payload => calls.push(['qty', payload])}
        onChanged={() => calls.push('changed')}
        onDelete={(barcode, index) => calls.push(['delete', barcode, index])}
        onEditWeighted={line => calls.push(['weight', line.barcode])}
        onCharge={() => calls.push('charge')}
      />,
      host
    );
    expect(host.textContent).to.contain('Quedan 2');
    expect(host.textContent).to.not.contain('Stock bajo');
    expect(host.textContent).to.contain('Ham');
    expect(host.textContent).to.contain('Bolsa');
    const charge = buttonNamed(host, 'Cobrar');
    expect(charge.disabled).to.equal(false);
    charge.click();
    host.querySelector('.sell-line').click();
    buttonNamed(host, 'Más').click();
    buttonNamed(host, 'Menos').click();
    buttonNamed(host, 'Quitar').click();
    const ham = host.querySelectorAll('.sell-line')[1];
    ham.querySelector('input').focus();
    const names = calls.map(call => Array.isArray(call) ? call[0] : call);
    expect(names).to.include.members(['charge', 'select', 'qty', 'changed', 'delete', 'weight']);
  });

  it('types a quantity on the keypad and skips a weighted line', () => {
    const calls = [];
    ReactDOM.render(
      <Cart
        order={{
          lines: [{
            kind: 'PRODUCT',
            barcode: 'rice',
            name: 'Arroz',
            unitPrice: Money.from(2),
            quantity: Quantity.from(1),
            vatRate: VatRate.standard(),
            weighted: false
          }],
          total: Money.from(2)
        }}
        selected={0}
        keypad
        onQuantityChange={payload => calls.push(payload)}
        onChanged={() => calls.push('changed')}
      />,
      host
    );
    expect(host.querySelector('.sell-keypad')).to.not.equal(null);
    buttonNamed(host, '2').click();
    expect(calls[0]).to.deep.equal({barcode: 'rice', quantityChanged: '12'});
    expect(calls[1]).to.equal('changed');
    ReactDOM.render(
      <Cart
        order={{
          lines: [{
            kind: 'PRODUCT',
            barcode: 'ham',
            name: 'Ham',
            unitPrice: Money.from(10),
            quantity: Quantity.from(1),
            vatRate: VatRate.standard(),
            weighted: true
          }],
          total: Money.from(10)
        }}
        selected={0}
        keypad
        onQuantityChange={payload => calls.push(payload)}
      />,
      host
    );
    const before = calls.length;
    buttonNamed(host, '5').click();
    expect(calls.length).to.equal(before);
  });
});

/**
 * @param {HTMLElement} node
 * @param {string} name
 * @returns {HTMLButtonElement}
 */
function buttonNamed(node, name) {
  return Array.prototype.find.call(
    node.querySelectorAll('button'),
    button => button.textContent.indexOf(name) !== -1 || button.getAttribute('aria-label') === name
  );
}
