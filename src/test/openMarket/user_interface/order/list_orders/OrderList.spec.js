import React from 'react';
import {expect} from 'chai';
import {mount} from '../../components/mount';
import OrderList from '../../../../../openMarket/user_interface/order/list_orders/OrderList';
import OrderSummary from '../../../../../openMarket/user_interface/order/list_orders/OrderSummary';
import {OrdersRanges} from '../../../../../openMarket/user_interface/order/list_orders/OrdersRanges';

const newer = {
  orderId: 'new',
  invoiceNumber: '2026/000002',
  createdAt: '2026-10-21T10:00:01',
  itemCount: 2,
  paymentMethod: 'card',
  totalCents: 350,
  cancelled: false
};
const older = {
  orderId: 'old',
  invoiceNumber: '2026/000001',
  createdAt: '2026-10-21T09:00:00',
  itemCount: 1,
  paymentMethod: 'cash',
  totalCents: 200,
  cancelled: true
};

function renderList(extra) {
  return mount(
    <OrderList
      items={[]}
      total={0}
      onOpen={() => {}}
      onLoadMore={() => {}}
      onRetry={() => {}}
      {...extra}
    />
  );
}

describe('OrderList', () => {
  it('renders rows newest first and marks the selected row', () => {
    const view = renderList({
      items: [newer, older],
      total: 2,
      selectedOrderId: 'new'
    });
    const rows = view.node.querySelectorAll('.orders-row');
    expect(rows).to.have.lengthOf(2);
    expect(rows[0].textContent).to.contain('2026/000002');
    expect(rows[0].textContent).to.contain('Tarjeta');
    expect(rows[1].textContent).to.contain('2026/000001');
    expect(rows[1].textContent).to.contain('Anulada');
    expect(rows[1].textContent).to.contain('Efectivo');
    expect(rows[0].className).to.contain('is-selected');
    expect(rows[0].getAttribute('aria-pressed')).to.equal('true');
    expect(rows[1].getAttribute('aria-pressed')).to.equal('false');
    expect(view.node.textContent).to.not.contain('Cargar más');
    view.unmount();
  });

  it('shows the empty period, a skeleton, an error, and load more', () => {
    const empty = renderList({});
    expect(empty.node.textContent).to.contain('No hay pedidos en este periodo');
    empty.unmount();

    const loading = renderList({loading: true});
    expect(loading.node.querySelector('.om-skeleton')).to.not.equal(null);
    expect(loading.node.textContent).to.not.contain('No hay pedidos');
    loading.unmount();

    let retried = false;
    const failed = renderList({error: 'db down', onRetry: () => { retried = true; }});
    expect(failed.node.textContent).to.contain('db down');
    expect(failed.node.textContent).to.not.contain('No hay pedidos');
    failed.node.querySelector('button').click();
    expect(retried).to.equal(true);
    failed.unmount();

    let more = false;
    const page = renderList({
      items: [newer],
      total: 4,
      error: 'stale',
      onLoadMore: () => { more = true; }
    });
    expect(page.node.textContent).to.contain('stale');
    expect(page.node.textContent).to.contain('2026/000002');
    page.node.querySelector('.orders-more button').click();
    expect(more).to.equal(true);
    page.unmount();
  });
});

describe('OrderSummary', () => {
  it('shows sales, tickets, and the average ticket', () => {
    const view = mount(
      <OrderSummary summary={{totalCents: 500, ticketCount: 2, averageCents: 250}} />
    );
    const facts = view.node.querySelectorAll('.orders-summary-fact');
    expect(facts[0].textContent).to.contain('Ventas');
    expect(facts[0].textContent).to.contain('5,00');
    expect(facts[1].querySelector('dd').textContent).to.equal('2');
    expect(facts[2].textContent).to.contain('Ticket medio');
    expect(facts[2].textContent).to.contain('2,50');
    view.unmount();
  });

  it('renders zeros when the summary is missing', () => {
    const view = mount(<OrderSummary />);
    expect(view.node.textContent).to.contain('Tickets');
    expect(view.node.querySelectorAll('dd')[1].textContent).to.equal('0');
    view.unmount();
  });
});

describe('OrdersRanges', () => {
  it('presses the active chip and opens the custom range', () => {
    let selected = '';
    let custom = false;
    const view = mount(
      <OrdersRanges
        rangeKey="week"
        onSelect={key => { selected = key; }}
        onCustom={() => { custom = true; }}
      />
    );
    const buttons = view.node.querySelectorAll('button');
    expect(buttons[2].textContent).to.contain('7 días');
    expect(buttons[2].getAttribute('aria-pressed')).to.equal('true');
    expect(buttons[0].getAttribute('aria-pressed')).to.equal('false');
    buttons[1].click();
    expect(selected).to.equal('yesterday');
    buttons[4].click();
    expect(custom).to.equal(true);
    expect(buttons[4].textContent).to.contain('Rango');
    view.unmount();
  });
});
