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

  it('shows an empty ticket with the cobrar literals and disabled actions', () => {
    ReactDOM.render(<Cart order={{lines: [], total: Money.ofCents(0)}} />, host);
    expect(host.textContent).to.contain('El ticket está vacío');
    expect(host.textContent).to.contain('0 líneas · 0 artículos');
    expect(host.textContent).to.contain('Base imponible');
    expect(host.textContent).to.contain('IVA incluido');
    expect(host.textContent).to.not.contain('VERI');
    expect(buttonNamed(host, 'Cobrar').disabled).to.equal(true);
    expect(buttonNamed(host, 'Vaciar ticket').disabled).to.equal(true);
    expect(buttonNamed(host, 'Aparcar').querySelector('.fa-pause')).to.not.equal(null);
    expect(buttonNamed(host, 'Descuento').querySelector('.fa-percent')).to.not.equal(null);
    expect(buttonNamed(host, 'Cajón').querySelector('.fa-inbox')).to.not.equal(null);
    expect(buttonNamed(host, 'Aparcar').disabled).to.equal(true);
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
            quantity: Quantity.from(2),
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
    expect(host.textContent).to.contain('/ ud');
    expect(host.textContent).to.contain('kg ×');
    expect(host.textContent).to.contain('0,350 kg');
    expect(host.querySelector('.sell-stepper .fa-plus')).to.not.equal(null);
    expect(host.querySelector('.sell-weight .fa-balance-scale')).to.not.equal(null);
    expect(host.querySelector('.sell-weight').textContent).to.contain('0,350');
    expect(host.textContent).to.contain('3 líneas · 4 artículos');
    expect(host.textContent).to.contain('Base imponible');
    expect(host.textContent).to.contain('IVA incluido');
    expect(host.textContent).to.not.contain('VERI');
    expect(host.querySelector('.sell-line.is-selected')).to.not.equal(null);
    expect(host.querySelector('.om-icon-button--danger')).to.equal(null);
    expect(buttonNamed(host, 'Aparcar').disabled).to.equal(true);
    expect(buttonNamed(host, 'Descuento').disabled).to.equal(true);
    expect(buttonNamed(host, 'Cajón').disabled).to.equal(true);
    expect(buttonNamed(host, 'Cliente').disabled).to.equal(true);
    const charge = buttonNamed(host, 'Cobrar');
    expect(charge.disabled).to.equal(false);
    charge.click();
    host.querySelector('.sell-line').click();
    buttonNamed(host, 'Más').click();
    buttonNamed(host, 'Menos').click();
    const ham = host.querySelectorAll('.sell-line')[1];
    buttonNamed(ham, 'Quitar').click();
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

  it('removes a single unit with the trash and empties the ticket after confirm', () => {
    const calls = [];
    const line = {
      kind: 'PRODUCT',
      barcode: 'rice',
      name: 'Arroz',
      unitPrice: Money.from(2),
      quantity: Quantity.from(1),
      vatRate: VatRate.standard(),
      weighted: false
    };
    ReactDOM.render(
      <Cart
        order={{lines: [line], total: Money.from(2)}}
        onDelete={(barcode, index) => calls.push(['delete', barcode, index])}
        onChanged={() => calls.push('changed')}
        onClear={() => calls.push('clear')}
      />,
      host
    );
    expect(buttonNamed(host, 'Menos')).to.equal(undefined);
    buttonNamed(host, 'Quitar').click();
    expect(calls).to.deep.equal([['delete', 'rice', 0], 'changed']);

    buttonNamed(host, 'Vaciar ticket').click();
    expect(host.textContent).to.contain('Se quitarán todas las líneas');
    buttonNamed(host, 'Cancelar').click();
    expect(host.textContent).to.not.contain('Se quitarán todas las líneas');
    expect(calls).to.not.include('clear');

    buttonNamed(host, 'Vaciar ticket').click();
    buttonNamed(host, 'Vaciar').click();
    expect(calls[calls.length - 1]).to.equal('clear');
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
