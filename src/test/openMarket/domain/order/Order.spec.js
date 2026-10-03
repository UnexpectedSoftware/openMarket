import {expect} from 'chai';
import Order from '../../../../openMarket/domain/order/Order';

const line = quantity => ({barcode: '1', name: 'Milk', price: 2, quantity});

describe('Order', () => {
  it('rejects an empty line list', () => {
    expect(() => new Order({id: '1', lines: []})).to.throw('Lines must not be empty');
  });

  it('rejects a line with quantity 0', () => {
    expect(() => new Order({id: '1', lines: [line(0)]})).to.throw('Quantity must be greater than 0');
    expect(() => new Order({id: '1', lines: [line('0')]})).to.throw('Quantity must be greater than 0');
  });

  it('rejects a negative quantity', () => {
    expect(() => new Order({id: '1', lines: [line(-1)]})).to.throw('Quantity must be greater than 0');
  });

  it('accepts a fractional quantity', () => {
    const order = new Order({
      id: '1',
      lines: [line(0.5)],
      date: '03/10/2026 10:00:00'
    });

    expect(order.lines[0].quantity).to.equal(0.5);
    expect(order.total).to.equal(1);
  });
});
