import React from 'react';
import {expect} from 'chai';
import {mount} from '../../components/mount';
import Container from '../../../../../openMarket/user_interface/order/list_orders/Container';
import {state} from '../../../../../openMarket/user_interface/order/list_orders/model';

function harness(orders, calls, extra) {
  return mount(
    <Container
      orders={orders}
      params={extra && extra.params}
      router={{
        push: path => calls.push(['push', path]),
        goBack: () => calls.push(['back'])
      }}
      ordersRangeSelected={payload => calls.push(['range', payload])}
      ordersCustomOpened={() => calls.push(['open'])}
      ordersCustomClosed={() => calls.push(['close'])}
      ordersCustomDraftChanged={payload => calls.push(['draft', payload])}
      ordersCustomRejected={message => calls.push(['rejected', message])}
      ordersSelectionMoved={delta => calls.push(['move', delta])}
      ordersRowSelected={orderId => calls.push(['row', orderId])}
      orderReprintRequested={orderId => calls.push(['reprint', orderId])}
      orderReprintClosed={() => calls.push(['reprint-close'])}
      orderReprintConfirmed={orderId => calls.push(['print', orderId])}
    />
  );
}

describe('orders list container', () => {
  it('loads today, changes range, and opens a row', () => {
    const calls = [];
    const orders = {
      ...state(),
      loading: false,
      items: [{
        orderId: 'a',
        invoiceNumber: '2026/000001',
        createdAt: '2026-10-21T10:00:00',
        itemCount: 1,
        paymentMethod: 'cash',
        totalCents: 200,
        cancelled: false
      }],
      total: 3,
      selectedOrderId: 'a'
    };
    const view = harness(orders, calls);
    expect(calls[0][0]).to.equal('range');
    expect(calls[0][1].key).to.equal('today');
    expect(calls[0][1].append).to.equal(false);

    const buttons = view.node.querySelectorAll('button');
    const ayer = Array.prototype.find.call(buttons, button => button.textContent.indexOf('Ayer') !== -1);
    ayer.click();
    expect(calls[calls.length - 1][1].key).to.equal('yesterday');

    view.node.querySelector('.orders-row').click();
    expect(calls[calls.length - 2]).to.deep.equal(['row', 'a']);
    expect(calls[calls.length - 1]).to.deep.equal(['push', '/list_orders/a']);

    view.node.querySelector('.orders-more button').click();
    expect(calls[calls.length - 1][1].append).to.equal(true);
    expect(calls[calls.length - 1][1].offset).to.equal(1);

    document.dispatchEvent(new view.node.ownerDocument.defaultView.KeyboardEvent('keydown', {key: 'ArrowDown'}));
    expect(calls[calls.length - 1]).to.deep.equal(['move', 1]);
    document.dispatchEvent(new view.node.ownerDocument.defaultView.KeyboardEvent('keydown', {key: 'Enter'}));
    expect(calls[calls.length - 1]).to.deep.equal(['push', '/list_orders/a']);
    document.dispatchEvent(new view.node.ownerDocument.defaultView.KeyboardEvent('keydown', {key: 'F9'}));
    expect(calls[calls.length - 1]).to.deep.equal(['reprint', 'a']);
    document.dispatchEvent(new view.node.ownerDocument.defaultView.KeyboardEvent('keydown', {key: 'F2'}));
    expect(calls[calls.length - 1]).to.deep.equal(['reprint', 'a']);
    const beforeEscape = calls.length;
    document.dispatchEvent(new view.node.ownerDocument.defaultView.KeyboardEvent('keydown', {key: 'Escape'}));
    expect(calls).to.have.lengthOf(beforeEscape);

    view.unmount();
  });

  it('rejects an inverted custom range and applies a valid one', () => {
    const calls = [];
    const invalid = harness({
      ...state(),
      loading: false,
      customOpen: true,
      customFrom: '2026-10-21',
      customTo: '2026-10-01'
    }, calls);
    const aplicar = Array.prototype.find.call(
      invalid.node.querySelectorAll('button'),
      button => button.textContent.indexOf('Aplicar') !== -1
    );
    aplicar.click();
    expect(calls[calls.length - 1]).to.deep.equal(['rejected', 'La fecha inicial es posterior a la final']);
    invalid.unmount();

    const validCalls = [];
    const valid = harness({
      ...state(),
      loading: false,
      customOpen: true,
      customFrom: '2026-10-01',
      customTo: '2026-10-21'
    }, validCalls);
    const apply = Array.prototype.find.call(
      valid.node.querySelectorAll('button'),
      button => button.textContent.indexOf('Aplicar') !== -1
    );
    apply.click();
    const chosen = validCalls[validCalls.length - 1][1];
    expect(chosen.key).to.equal('custom');
    expect(chosen.from).to.equal('2026-10-01 00:00:00');
    expect(chosen.to).to.equal('2026-10-21 23:59:59');

    const close = valid.node.querySelector('button[aria-label="Close"]');
    close.click();
    expect(validCalls[validCalls.length - 1]).to.deep.equal(['close']);
    valid.node.querySelector('#orders-range-from').value = '2026-10-02';
    valid.node.querySelector('#orders-range-from').dispatchEvent(new valid.node.ownerDocument.defaultView.Event('input', {bubbles: true}));
    valid.node.querySelector('#orders-range-from').dispatchEvent(new valid.node.ownerDocument.defaultView.Event('change', {bubbles: true}));
    valid.unmount();
  });

  it('retries a failed load', () => {
    const calls = [];
    const view = harness({
      ...state(),
      loading: false,
      error: 'db down',
      items: []
    }, calls);
    const retry = Array.prototype.find.call(
      view.node.querySelectorAll('button'),
      button => button.textContent.indexOf('Reintentar') !== -1
    );
    retry.click();
    expect(calls[calls.length - 1][1].key).to.equal('today');
    expect(calls[calls.length - 1][1].append).to.equal(false);
    view.unmount();
  });

  it('goes back from an open detail with Escape', () => {
    const calls = [];
    const view = harness({...state(), loading: false, selectedOrderId: 'a'}, calls, {params: {id: 'a'}});
    document.dispatchEvent(new view.node.ownerDocument.defaultView.KeyboardEvent('keydown', {key: 'Escape'}));
    expect(calls[calls.length - 1]).to.deep.equal(['back']);
    view.unmount();
  });
});
