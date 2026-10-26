import {expect} from 'chai';
import Order from '../../../../../openMarket/domain/order/Order';
import Money from '../../../../../openMarket/domain/money/Money';
import VatRate from '../../../../../openMarket/domain/tax/VatRate';
import {addProduct, addFreeLine, asLine, cartTotal, updateQuantity, vatRows} from '../../../../../openMarket/user_interface/order/new_order/model';

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

  it('keeps on-hand stock on a low line when the quantity changes', () => {
    const added = addProduct({
      lines: [],
      product: {
        barcode: '1',
        name: 'Milk',
        price: 2,
        stock: 2,
        stockMin: 2,
        isStockLow() {
          return true;
        }
      },
      quantity: 1
    });
    expect(added.order.lines[0].lowStock).to.equal(true);
    expect(added.order.lines[0].stock).to.equal(2);
    const changed = updateQuantity({lines: added.order.lines, barcode: '1', quantity: 2});
    expect(changed.order.lines[0].stock).to.equal(2);
    expect(changed.order.lines[0].lowStock).to.equal(true);
    expect(changed.order.lines[0].quantity.milli).to.equal(2000);
  });

  it('normalizes a blank line, a free line, and a counted line', () => {
    const blank = asLine(null);
    expect(blank.kind).to.equal('PRODUCT');
    expect(blank.barcode).to.equal('');
    expect(blank.name).to.equal('');
    expect(blank.quantity.milli).to.equal(0);
    expect(blank.stock).to.equal(null);
    expect(blank.lowStock).to.equal(false);
    expect(blank.weighted).to.equal(undefined);
    expect(blank.unitPrice.cents).to.equal(0);

    const free = asLine({kind: 'FREE', name: 'Bolsa', price: 1, vat: 'S1:10', lowStock: true, stock: 4});
    expect(free.kind).to.equal('FREE');
    expect(free.barcode).to.equal('');
    expect(free.name).to.equal('Bolsa');
    expect(free.quantity.milli).to.equal(1000);
    expect(free.unitPrice.cents).to.equal(100);
    expect(free.vatRate.percent).to.equal(10);
    expect(free.stock).to.equal(4);
    expect(free.lowStock).to.equal(true);

    const counted = asLine({
      barcode: 12,
      name: 'Milk',
      unitPrice: Money.from(2),
      quantity: 3,
      vatRate: VatRate.standard(),
      weighted: true,
      stock: 0,
      lowStock: 1
    });
    expect(counted.barcode).to.equal('12');
    expect(counted.stock).to.equal(0);
    expect(counted.lowStock).to.equal(true);
    expect(counted.weighted).to.equal(true);
    expect(counted.quantity.milli).to.equal(3000);
    expect(counted.unitPrice.cents).to.equal(200);

    const loose = asLine({barcode: null, name: null, weighted: 'yes', stock: '', lowStock: 0, quantity: 'nope'});
    expect(loose.barcode).to.equal('');
    expect(loose.name).to.equal('');
    expect(loose.weighted).to.equal(undefined);
    expect(loose.stock).to.equal(null);
    expect(loose.lowStock).to.equal(false);
    expect(loose.quantity.milli).to.equal(0);
  });

  it('keeps an empty cart at zero cents', () => {
    expect(cartTotal([]).cents).to.equal(0);
    expect(cartTotal([]).equals(Money.ofCents(0))).to.equal(true);
  });
});
