import {expect} from 'chai';
import Order from '../../../../openMarket/domain/order/Order';
import ErrorCode from '../../../../openMarket/domain/error/ErrorCode';
import EmptyOrderLinesError from '../../../../openMarket/domain/order/EmptyOrderLinesError';
import InvalidOrderQuantityError from '../../../../openMarket/domain/order/InvalidOrderQuantityError';
import OrderAlreadyPlacedError from '../../../../openMarket/domain/order/OrderAlreadyPlacedError';
import InvalidOrderLineError from '../../../../openMarket/domain/order/InvalidOrderLineError';
import Money from '../../../../openMarket/domain/money/Money';
import VatRate from '../../../../openMarket/domain/tax/VatRate';

const date = '03/10/2026 10:00:00';
const line = quantity => ({barcode: '1', name: 'Milk', price: 2, quantity});

function plain(orderLine) {
  return {
    barcode: orderLine.barcode,
    name: orderLine.name,
    cents: orderLine.price.cents,
    milli: orderLine.quantity.milli,
    amount: orderLine.amount.cents
  };
}

describe('Order', () => {
  it('keeps a draft with no lines until it is placed', () => {
    const order = Order.draft({id: '1', date});

    expect(order.isPlaced()).to.equal(false);
    expect(order.lines).to.deep.equal([]);
    expect(order.total.cents).to.equal(0);
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

  it('rejects a negative quantity before the line is added', () => {
    const order = Order.draft({id: '1', date});

    expect(() => order.addLine(line(-1))).to.throw(InvalidOrderLineError, 'Quantity must be greater than 0');
    expect(order.lines).to.deep.equal([]);
    expect(order.isPlaced()).to.equal(false);
  });

  it('rejects a fraction on a whole-unit product', () => {
    const order = Order.draft({id: '1', date});

    expect(() => order.addLine({...line(0.5), weighted: false})).to.throw(InvalidOrderLineError);
    expect(order.lines).to.deep.equal([]);
    expect(() => new Order({
      id: '1',
      lines: [{...line(0.5), weighted: false}],
      date
    }).place()).to.throw(InvalidOrderLineError);
  });

  it('adds a free-amount line with quantity 1 and no barcode', () => {
    const order = Order.draft({id: '1', date})
      .addFreeLine({
        description: ' Venta libre ',
        amount: Money.from('3.50'),
        vatRate: VatRate.of({kind: 'S1', percent: 10})
      })
      .place();

    expect(order.lines[0].kind).to.equal('FREE');
    expect(order.lines[0].barcode).to.equal('');
    expect(order.lines[0].name).to.equal('Venta libre');
    expect(order.lines[0].quantity.milli).to.equal(1000);
    expect(order.lines[0].amount.cents).to.equal(350);
    expect(order.lines[0].vatRate.code()).to.equal('S1:10');
    expect(order.total.cents).to.equal(350);
  });

  it('refuses a free line without a description or a positive amount', () => {
    const order = Order.draft({id: '1', date});

    expect(() => order.addFreeLine({description: '  ', amount: 1})).to.throw(InvalidOrderLineError);
    expect(() => order.addFreeLine({description: 'Venta libre', amount: 0})).to.throw(InvalidOrderLineError);
    expect(() => order.addFreeLine({description: 'Venta libre', amount: -1})).to.throw(InvalidOrderLineError);
    expect(order.lines).to.deep.equal([]);
    order.addLine(line(1)).place();
    expect(() => order.addFreeLine({description: 'Venta libre', amount: 1})).to.throw(OrderAlreadyPlacedError);
  });

  it('accepts a fractional quantity when the order is placed', () => {
    const order = new Order({
      id: '1',
      lines: [line(0.5)],
      date
    }).place();

    expect(order.isPlaced()).to.equal(true);
    expect(order.lines[0].quantity.units).to.equal(0.5);
    expect(order.total.cents).to.equal(100);
  });

  it('rounds a weighed line half-up once', () => {
    const order = new Order({
      id: '1',
      lines: [{barcode: '1', name: 'Ham', price: '18.50', quantity: '0.350'}],
      date
    }).place();

    expect(order.lines[0].amount.cents).to.equal(648);
    expect(order.total.cents).to.equal(648);
  });

  it('returns a copy of its lines', () => {
    const order = new Order({id: '1', lines: [line(2)], date}).place();
    const returned = order.lines;

    returned.push(line(1));
    returned[0].quantity = 9;
    returned[0].name = 'Changed';

    expect(order.lines.map(plain)).to.deep.equal([{
      barcode: '1',
      name: 'Milk',
      cents: 200,
      milli: 2000,
      amount: 400
    }]);
    expect(order.total.cents).to.equal(400);
    expect(order.lines[0].quantity.milli).to.equal(2000);
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
    expect(zero.lines[0].quantity.milli).to.equal(0);
    expect(zero.place()).to.equal(zero);
    expect(() => zero.addLine(line(1))).to.throw(OrderAlreadyPlacedError);
  });
});
