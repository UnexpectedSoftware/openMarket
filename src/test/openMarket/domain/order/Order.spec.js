import {expect} from 'chai';
import Order from '../../../../openMarket/domain/order/Order';
import ErrorCode from '../../../../openMarket/domain/error/ErrorCode';
import EmptyOrderLinesError from '../../../../openMarket/domain/order/EmptyOrderLinesError';
import InvalidOrderQuantityError from '../../../../openMarket/domain/order/InvalidOrderQuantityError';
import OrderAlreadyPlacedError from '../../../../openMarket/domain/order/OrderAlreadyPlacedError';

const date = '03/10/2026 10:00:00';
const line = quantity => ({barcode: '1', name: 'Milk', price: 2, quantity});

describe('Order', () => {
  it('keeps a draft with no lines until it is placed', () => {
    const order = Order.draft({id: '1', date});

    expect(order.isPlaced()).to.equal(false);
    expect(order.lines).to.deep.equal([]);
    expect(order.total).to.equal(0);
    expect(() => order.place()).to.throw(EmptyOrderLinesError, 'Lines must not be empty');
    expect(order.isPlaced()).to.equal(false);
  });

  it('rejects a line with quantity 0 when the order is placed', () => {
    const order = new Order({id: '1', lines: [line(0)], date});

    expect(order.isPlaced()).to.equal(false);
    expect(() => order.place()).to.throw(InvalidOrderQuantityError);
    try {
      order.place();
    } catch (error) {
      expect(error.code).to.equal(ErrorCode.ORDER_QUANTITY_INVALID);
      expect(error.context.quantity).to.equal(0);
      expect(error.context.barcode).to.equal('1');
    }
    expect(() => new Order({id: '1', lines: [line('0')], date}).place())
      .to.throw('Quantity must be greater than 0');
    expect(order.isPlaced()).to.equal(false);
  });

  it('rejects a negative quantity when the order is placed and stays a draft', () => {
    const order = Order.draft({id: '1', date})
      .addLine(line(-1));

    expect(() => order.place()).to.throw('Quantity must be greater than 0');
    expect(order.isPlaced()).to.equal(false);
  });

  it('accepts a fractional quantity when the order is placed', () => {
    const order = new Order({
      id: '1',
      lines: [line(0.5)],
      date
    }).place();

    expect(order.isPlaced()).to.equal(true);
    expect(order.lines[0].quantity).to.equal(0.5);
    expect(order.total).to.equal(1);
  });

  it('returns a copy of its lines', () => {
    const order = new Order({id: '1', lines: [line(2)], date}).place();
    const returned = order.lines;

    returned.push(line(1));
    returned[0].quantity = 9;
    returned[0].name = 'Changed';

    expect(order.lines).to.deep.equal([line(2)]);
    expect(order.total).to.equal(4);
    expect(order.lines[0].quantity).to.equal(2);
  });

  it('places an order once', () => {
    const order = new Order({id: '1', lines: [line(1)], date}).place();

    expect(order.place()).to.equal(order);
    expect(order.isPlaced()).to.equal(true);
    expect(() => order.addLine(line(1))).to.throw(OrderAlreadyPlacedError, 'Order is already placed');
    try {
      order.addLine(line(1));
    } catch (error) {
      expect(error.code).to.equal(ErrorCode.ORDER_ALREADY_PLACED);
    }
    expect(order.lines).to.have.lengthOf(1);
  });

  it('rebuilds a stored order without applying the line rules again', () => {
    const empty = Order.restore({id: '1', lines: [], date});
    const zero = Order.restore({id: '2', lines: [line(0)], date});

    expect(empty.isPlaced()).to.equal(true);
    expect(empty.lines).to.deep.equal([]);
    expect(zero.isPlaced()).to.equal(true);
    expect(zero.lines[0].quantity).to.equal(0);
    expect(zero.place()).to.equal(zero);
    expect(() => zero.addLine(line(1))).to.throw(OrderAlreadyPlacedError);
  });
});
