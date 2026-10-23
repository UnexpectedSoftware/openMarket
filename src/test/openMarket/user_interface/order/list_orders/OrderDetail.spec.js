import React from 'react';
import {expect} from 'chai';
import {mount} from '../../components/mount';
import OrderDetail, {OrderDetailRoute} from '../../../../../openMarket/user_interface/order/list_orders/OrderDetail';

const detail = {
  orderId: 'a',
  invoiceNumber: '2026/000042',
  invoiceType: 'F2',
  cancelled: true,
  createdAt: '2026-10-21T10:00:00',
  payment: {method: 'cash', tenderedCents: 2000, changeCents: 687},
  lines: [
    {
      kind: 'PRODUCT',
      barcode: '2600000000001',
      name: 'Ham',
      unitPriceCents: 1850,
      quantityMilli: 350,
      weighted: true,
      amountCents: 648,
      vat: {kind: 'S1', percent: 10, cause: null}
    },
    {
      kind: 'FREE',
      barcode: '',
      name: 'Bolsa',
      unitPriceCents: 50,
      quantityMilli: 1000,
      weighted: false,
      amountCents: 50,
      vat: {kind: 'S1', percent: 21, cause: null}
    }
  ],
  vat: [{kind: 'S1', percent: 10, cause: null, baseCents: 589, quotaCents: 59}],
  totalCents: 698
};

describe('OrderDetail pane', () => {
  it('shows the invoice heading, a weighed line, and Reimprimir', () => {
    const calls = [];
    const view = mount(
      <OrderDetail
        status="ready"
        detail={detail}
        onReprint={() => calls.push('reprint')}
        onRetry={() => calls.push('retry')}
      />
    );
    const heading = view.node.querySelector('h2');
    expect(heading.textContent).to.contain('2026/000042');
    expect(heading.textContent).to.contain('21/10/2026');
    expect(heading.textContent).to.contain('Anulada');
    expect(view.node.textContent).to.contain('Factura simplificada');
    expect(view.node.textContent).to.contain('0,350 kg');
    expect(view.node.textContent).to.contain('Ham');
    expect(view.node.textContent).to.contain('Bolsa');
    expect(view.node.querySelector('.orders-detail-aside')).to.not.equal(null);
    expect(view.node.textContent).to.contain('Reimprimir');
    view.node.querySelector('.orders-detail-actions button').click();
    expect(calls).to.deep.equal(['reprint']);
    view.unmount();
  });

  it('says when the order does not exist', () => {
    const view = mount(
      <OrderDetail status="missing" onReprint={() => {}} onRetry={() => {}} />
    );
    expect(view.node.textContent).to.contain('Pedido no encontrado');
    view.unmount();
  });

  it('requests the route id', () => {
    const calls = [];
    const view = mount(
      <OrderDetailRoute
        params={{id: 'a'}}
        orders={{detailStatus: 'loading', detail: null, detailError: ''}}
        orderDetailRequested={id => calls.push(['load', id])}
        orderReprintRequested={id => calls.push(['reprint', id])}
      />
    );
    expect(calls).to.deep.equal([['load', 'a']]);
    view.node.querySelector('button') && view.node.querySelector('button').click();
    view.unmount();
  });
});
