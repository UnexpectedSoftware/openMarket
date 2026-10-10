import {expect} from 'chai';
import Order from '../../../../openMarket/domain/order/Order';
import ErrorCode from '../../../../openMarket/domain/error/ErrorCode';
import EmptyOrderLinesError from '../../../../openMarket/domain/order/EmptyOrderLinesError';
import InvalidOrderQuantityError from '../../../../openMarket/domain/order/InvalidOrderQuantityError';

const line = quantity => ({barcode: '1', name: 'Milk', price: 2, quantity});

describe('Order', () => {
  it('rejects an empty line list', () => {
    expect(() => new Order({id: '1', lines: []}))
      .to.throw(EmptyOrderLinesError, 'Lines must not be empty');
  });

  it('rejects a line with quantity 0', () => {
    expect(() => new Order({id: '1', lines: [line(0)]})).to.throw(InvalidOrderQuantityError);
    try {
      new Order({id: '1', lines: [line(0)]});
    } catch (error) {
      expect(error.code).to.equal(ErrorCode.ORDER_QUANTITY_INVALID);
      expect(error.context.quantity).to.equal(0);
      expect(error.context.barcode).to.equal('1');
    }
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
