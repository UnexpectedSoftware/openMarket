import {expect} from 'chai';
import Order from '../../../../../openMarket/domain/order/Order';
import Money from '../../../../../openMarket/domain/money/Money';
import VatRate from '../../../../../openMarket/domain/tax/VatRate';
import {addProduct, addFreeLine, cartTotal, vatRows} from '../../../../../openMarket/user_interface/order/new_order/model';

describe('sell cart', () => {
  it('matches the order total for mixed rates, a weighed line, and a free line', () => {
    const cart = addFreeLine({
      lines: addProduct({
        lines: addProduct({
          lines: [],
          product: {barcode: '1', name: 'Milk', price: '1.10', vatRate: VatRate.of({kind: 'S1', percent: 10})},
          quantity: 1
        }).order.lines,
        product: {barcode: '2', name: 'Ham', price: '18.50', isWeighted: true},
        quantity: 0.35
      }).order.lines,
      description: 'Venta libre',
      amount: '3.50',
      vatRate: 'S1:21'
    });

    const order = Order.draft({id: '1', date: '18/10/2026 10:00:00'})
      .addLine({barcode: '1', name: 'Milk', price: '1.10', quantity: 1, vatRate: VatRate.of({kind: 'S1', percent: 10})})
      .addLine({barcode: '2', name: 'Ham', price: '18.50', quantity: 0.35, weighted: true})
      .addFreeLine({description: 'Venta libre', amount: '3.50', vatRate: 'S1:21'})
      .place();

    expect(cart.order.total.cents).to.equal(order.total.cents);
    expect(cartTotal(cart.order.lines).cents).to.equal(110 + 648 + 350);
    expect(vatRows([])).to.deep.equal([]);
    expect(vatRows(cart.order.lines).map(row => row.label)).to.deep.equal(['10 %', '21 %']);
  });

  it('keeps an empty cart at zero cents', () => {
    expect(cartTotal([]).cents).to.equal(0);
    expect(cartTotal([]).equals(Money.ofCents(0))).to.equal(true);
  });
});
