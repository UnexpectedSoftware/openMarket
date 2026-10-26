import {installDom} from '../../components/domSetup';
import React from 'react';
import ReactDOM from 'react-dom';
import {expect} from 'chai';
import {
  SellCatalog,
  SellDialogs,
  SellGrid,
  SellTop,
  gridNotice,
  reprintBody,
  sellTile,
  tileInitials
} from '../../../../../openMarket/user_interface/order/new_order/SellScreen';

describe('sell screen pieces', () => {
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

  it('shows chips and tiles, and the scanner search without the grid', () => {
    const picks = [];
    ReactDOM.render(
      <SellCatalog
        categories={[{id: 'shop', name: 'Shop'}]}
        categoryId="shop"
        tiles={[{barcode: '1', name: 'Lentejas', priceCents: 200, lowStock: true, stock: 1}]}
        tilesStatus="ready"
        onOpenFree={() => picks.push('free')}
        onSelectCategory={id => picks.push(id)}
        onPick={barcode => picks.push(barcode)}
      />,
      host
    );
    expect(host.querySelector('.sell-chips')).to.not.equal(null);
    expect(host.textContent).to.contain('Lentejas');
    expect(host.textContent).to.contain('Quedan');
    host.querySelector('.sell-tile:not(.sell-tile-free)').click();
    host.querySelector('.sell-tile-free').click();
    buttonNamed(host, 'Todos').click();
    expect(picks).to.deep.equal(['1', 'free', null]);

    ReactDOM.render(
      <SellCatalog scanner search={<span className="finder">scan</span>} onOpenFree={() => picks.push('free2')} />,
      host
    );
    expect(host.querySelector('.sell-grid')).to.equal(null);
    expect(host.textContent).to.contain('scan');
    buttonNamed(host, 'Venta libre').click();
    expect(picks).to.include('free2');
  });

  it('shows loading, error, and empty notices', () => {
    ReactDOM.render(<SellGrid tiles={[]} tilesStatus="loading" />, host);
    expect(host.querySelector('.om-skeleton')).to.not.equal(null);
    expect(gridNotice('loading', 2)).to.equal(null);
    ReactDOM.render(<SellGrid tiles={[]} tilesStatus="error" />, host);
    expect(host.textContent).to.contain('No se pudieron cargar los productos');
    ReactDOM.render(<SellGrid tiles={[]} tilesStatus="ready" />, host);
    expect(host.textContent).to.contain('No hay productos');
    const tile = sellTile({barcode: '9', name: 'Foto', priceCents: 100, imageUrl: 'pic.png'}, null);
    ReactDOM.render(<div>{tile}</div>, host);
    expect(host.querySelector('img').getAttribute('src')).to.equal('pic.png');
    expect(host.querySelector('.sell-tile-initials')).to.equal(null);
    expect(host.querySelector('.sell-tile-photo')).to.not.equal(null);
  });

  it('shows initials on every card and peso marks on a weighed card', () => {
    expect(tileInitials('Queso manchego')).to.equal('QM');
    expect(tileInitials('Pan de pueblo')).to.equal('PP');
    expect(tileInitials('Lentejas')).to.equal('LE');
    expect(tileInitials('')).to.equal('');

    ReactDOM.render(
      <div>
        {sellTile({barcode: 'ham', name: 'Queso manchego', priceCents: 1850, weighted: true}, null)}
        {sellTile({barcode: 'rice', name: 'Lentejas', priceCents: 200, weighted: false}, null)}
      </div>,
      host
    );
    const cards = host.querySelectorAll('.sell-tile');
    const weighed = cards[0];
    const counted = cards[1];
    expect(weighed.querySelector('.sell-tile-initials').textContent).to.equal('QM');
    expect(weighed.querySelector('.sell-tile-peso').textContent).to.contain('peso');
    expect(weighed.querySelector('.sell-tile-peso .fa-balance-scale')).to.not.equal(null);
    expect(weighed.querySelector('.sell-tile-mark .fa-balance-scale')).to.not.equal(null);
    expect(weighed.querySelector('.sell-tile-unit').textContent).to.equal('/kg');
    expect(weighed.querySelector('.sell-tile-price').textContent).to.contain('18,50');
    expect(counted.querySelector('.sell-tile-initials').textContent).to.equal('LE');
    expect(counted.querySelector('.sell-tile-peso')).to.equal(null);
    expect(counted.querySelector('.sell-tile-mark')).to.equal(null);
    expect(counted.textContent).to.not.contain('/kg');
    expect(counted.querySelector('.sell-tile-photo')).to.not.equal(null);
  });

  it('puts the shop name on the top bar and the receipt in the reprint dialog', () => {
    ReactDOM.render(<SellTop subtitle="Sol · NIF B1" shopName="Sol" search={<span>buscar</span>} />, host);
    expect(host.querySelector('h1').textContent).to.equal('Vender');
    expect(host.querySelector('.om-page-header-subtitle').textContent).to.contain('NIF B1');
    expect(host.querySelector('.sell-shop').textContent).to.equal('Sol');
    expect(host.querySelector('.sell-clock').textContent).to.match(/^\d{2}:\d{2}$/);
    ReactDOM.render(<SellTop shopName="" />, host);
    expect(host.querySelector('.sell-shop')).to.equal(null);

    const html = reprintBody('<p>ticket</p>');
    expect(html.props.className).to.equal('om-receipt-preview');
    expect(reprintBody('').props.className).to.equal('payment-preview-wait');

    ReactDOM.render(
      <SellDialogs
        view={{
          freeOpen: true,
          freeValid: false,
          freeDescription: '',
          freeAmount: '',
          freeVat: 'S1:21',
          helpOpen: false,
          paymentOpen: false,
          reprintOpen: true,
          reprintHtml: '<p>ticket</p>',
          order: {total: null}
        }}
        freeAmountRef={{current: null}}
        onCloseFree={() => {}}
        onConfirmFree={() => {}}
        onFreeDescription={() => {}}
        onFreeAmount={() => {}}
        onFreeVat={() => {}}
        onCloseHelp={() => {}}
        onCloseReprint={() => {}}
        onPrintLast={() => {}}
        onPayMethod={() => {}}
        onTendered={() => {}}
        onTogglePreview={() => {}}
        onConfirmPayment={() => {}}
        onClosePayment={() => {}}
      />,
      host
    );
    expect(host.textContent).to.contain('Venta libre');
    expect(host.textContent).to.contain('ticket');
    const save = buttonNamed(host, 'Guardar');
    expect(save.disabled).to.equal(true);
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
