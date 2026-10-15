import {expect} from 'chai';
import Invoice from '../../../../openMarket/domain/invoice/Invoice';
import InvoiceNumber from '../../../../openMarket/domain/invoice/InvoiceNumber';
import InvoiceStatus from '../../../../openMarket/domain/invoice/InvoiceStatus';
import InvalidInvoiceError from '../../../../openMarket/domain/invoice/InvalidInvoiceError';
import InvoiceAlreadyCancelledError from '../../../../openMarket/domain/invoice/InvoiceAlreadyCancelledError';
import ErrorCode from '../../../../openMarket/domain/error/ErrorCode';
import Order from '../../../../openMarket/domain/order/Order';

const issuedAt = '2026-10-14T12:00:00.000Z';
const orderDate = '14/10/2026 12:00:00';

function number() {
  return new InvoiceNumber({series: 'A', number: 1});
}

function placed(lines, id = 'order-1') {
  return new Order({id, lines, date: orderDate}).place();
}

function plain(line) {
  return {
    barcode: line.barcode,
    name: line.name,
    cents: line.price.cents,
    milli: line.quantity.milli,
    amount: line.amount.cents
  };
}

function issue(order) {
  return Invoice.issue({
    id: 'invoice-1',
    invoiceNumber: number(),
    issuedAt,
    order
  });
}

describe('Invoice', () => {
  it('rejects an order that has not been placed', () => {
    const draft = new Order({
      id: 'order-1',
      lines: [{barcode: '1', name: 'Milk', price: 2, quantity: 1}],
      date: orderDate
    });

    expect(() => issue(draft)).to.throw(InvalidInvoiceError);
    try {
      issue(draft);
    } catch (error) {
      expect(error.code).to.equal(ErrorCode.INVOICE_INVALID);
      expect(error.context.field).to.equal('order');
    }
  });

  it('rejects a missing issue time', () => {
    expect(() => Invoice.issue({
      id: 'invoice-1',
      invoiceNumber: number(),
      issuedAt: ' ',
      order: placed([{barcode: '1', name: 'Milk', price: 2, quantity: 1}])
    })).to.throw(InvalidInvoiceError);
  });

  it('copies the order lines and rounds the total to cents', () => {
    const input = [
      {barcode: '1', name: 'Milk', price: 0.1, quantity: 1},
      {barcode: '2', name: 'Bread', price: 0.2, quantity: 1}
    ];
    const order = placed(input);
    input[0].quantity = 9;
    const invoice = issue(order);
    order.lines[0].quantity = 4;

    expect(invoice.invoiceNumber.formatted).to.equal('A/000001');
    expect(invoice.issuedAt).to.equal(issuedAt);
    expect(invoice.orderId).to.equal('order-1');
    expect(invoice.status).to.equal(InvoiceStatus.ISSUED);
    expect(invoice.cancelledAt).to.equal(null);
    expect(invoice.total.equals(order.total)).to.equal(true);
    expect(invoice.total.cents).to.equal(30);
    expect(invoice.lines.map(plain)).to.deep.equal([
      {barcode: '1', name: 'Milk', cents: 10, milli: 1000, amount: 10},
      {barcode: '2', name: 'Bread', cents: 20, milli: 1000, amount: 20}
    ]);

    const returned = invoice.lines;
    returned[0].quantity = 4;
    returned.push({barcode: '3', name: 'Tea', price: 1, quantity: 1, amount: 1});
    expect(invoice.lines).to.have.lengthOf(2);
    expect(invoice.lines[0].quantity.milli).to.equal(1000);
    expect(invoice.total.cents).to.equal(30);
  });

  it('returns stored amounts instead of calculating them again', () => {
    const invoice = Invoice.restore({
      id: 'invoice-1',
      invoiceNumber: number(),
      issuedAt,
      lines: [{barcode: '1', name: 'Milk', price: 0.1, quantity: 3, amount: 9.99}],
      orderId: 'order-1',
      status: InvoiceStatus.ISSUED,
      cancelledAt: null,
      total: 9.99
    });

    expect(invoice.lines[0].amount.cents).to.equal(999);
    expect(invoice.total.cents).to.equal(999);
    expect(invoice.lines[0].price.cents).to.equal(10);
    expect(invoice.lines[0].quantity.milli).to.equal(3000);
  });

  it('copies a restored order without applying the order line rules again', () => {
    const order = Order.restore({
      id: 'order-1',
      lines: [{barcode: '1', name: 'Milk', price: 2, quantity: 0}],
      date: orderDate
    });
    const invoice = issue(order);

    expect(invoice.orderId).to.equal('order-1');
    expect(invoice.total.cents).to.equal(0);
    expect(invoice.lines.map(plain)).to.deep.equal([
      {barcode: '1', name: 'Milk', cents: 200, milli: 0, amount: 0}
    ]);
  });

  it('copies weighed order cents without calculating them again', () => {
    const order = placed([{barcode: '1', name: 'Ham', price: '18.50', quantity: '0.350'}]);
    const invoice = issue(order);

    expect(invoice.lines[0].amount.cents).to.equal(order.lines[0].amount.cents);
    expect(invoice.total.cents).to.equal(648);
    expect(invoice.total.equals(order.total)).to.equal(true);
  });

  it('accepts a fractional quantity and a zero price', () => {
    const weighed = issue(placed([{barcode: '1', name: 'Ham', price: 2, quantity: 0.5}]));
    expect(weighed.lines[0].quantity.units).to.equal(0.5);
    expect(weighed.lines[0].amount.cents).to.equal(100);
    expect(weighed.total.cents).to.equal(100);

    const free = issue(placed([{barcode: '2', name: 'Bag', price: 0, quantity: 1}], 'order-2'));
    expect(free.total.cents).to.equal(0);
    expect(free.orderId).to.equal('order-2');
  });

  it('keeps the issued document when it is cancelled', () => {
    const invoice = issue(placed([{barcode: '1', name: 'Milk', price: 2, quantity: 1}]));
    const lines = invoice.lines;

    invoice.cancel({cancelledAt: '2026-10-14T13:00:00.000Z'});

    expect(invoice.status).to.equal(InvoiceStatus.CANCELLED);
    expect(invoice.cancelledAt).to.equal('2026-10-14T13:00:00.000Z');
    expect(invoice.invoiceNumber.formatted).to.equal('A/000001');
    expect(invoice.issuedAt).to.equal(issuedAt);
    expect(invoice.total.cents).to.equal(200);
    expect(invoice.lines).to.deep.equal(lines);
  });

  it('rejects a second cancellation and leaves the first time in place', () => {
    const invoice = issue(placed([{barcode: '1', name: 'Milk', price: 2, quantity: 1}]));
    invoice.cancel({cancelledAt: '2026-10-14T13:00:00.000Z'});

    expect(() => invoice.cancel({cancelledAt: '2026-10-14T14:00:00.000Z'}))
      .to.throw(InvoiceAlreadyCancelledError);
    try {
      invoice.cancel({cancelledAt: '2026-10-14T14:00:00.000Z'});
    } catch (error) {
      expect(error.code).to.equal(ErrorCode.INVOICE_ALREADY_CANCELLED);
    }
    expect(invoice.cancelledAt).to.equal('2026-10-14T13:00:00.000Z');
    expect(invoice.lines).to.have.lengthOf(1);
  });
});
