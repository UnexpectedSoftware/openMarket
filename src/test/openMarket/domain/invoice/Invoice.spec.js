import {expect} from 'chai';
import Invoice from '../../../../openMarket/domain/invoice/Invoice';
import InvoiceNumber from '../../../../openMarket/domain/invoice/InvoiceNumber';
import InvoiceStatus from '../../../../openMarket/domain/invoice/InvoiceStatus';
import EmptyInvoiceLinesError from '../../../../openMarket/domain/invoice/EmptyInvoiceLinesError';
import InvalidInvoiceLineError from '../../../../openMarket/domain/invoice/InvalidInvoiceLineError';
import InvalidInvoiceError from '../../../../openMarket/domain/invoice/InvalidInvoiceError';
import InvoiceAlreadyCancelledError from '../../../../openMarket/domain/invoice/InvoiceAlreadyCancelledError';
import ErrorCode from '../../../../openMarket/domain/error/ErrorCode';

const issuedAt = '2026-10-14T12:00:00.000Z';

function number() {
  return new InvoiceNumber({series: 'A', number: 1});
}

function issue(lines, extra = {}) {
  return Invoice.issue({
    id: 'invoice-1',
    invoiceNumber: number(),
    issuedAt,
    lines,
    ...extra
  });
}

describe('Invoice', () => {
  it('rejects an empty line list', () => {
    expect(() => issue([])).to.throw(EmptyInvoiceLinesError, 'Lines must not be empty');
    try {
      issue([]);
    } catch (error) {
      expect(error.code).to.equal(ErrorCode.INVOICE_LINES_EMPTY);
    }
  });

  it('rejects a line that cannot be billed', () => {
    expect(() => issue([{barcode: '1', name: 'Milk', price: 2, quantity: 0}]))
      .to.throw(InvalidInvoiceLineError, 'Quantity must be greater than 0');
    expect(() => issue([{barcode: '1', name: 'Milk', price: -1, quantity: 1}]))
      .to.throw('Price must be zero or greater');
    expect(() => issue([{barcode: '1', name: ' ', price: 1, quantity: 1}]))
      .to.throw('Invoice line is incomplete');
  });

  it('rejects a missing issue time', () => {
    expect(() => Invoice.issue({
      id: 'invoice-1',
      invoiceNumber: number(),
      issuedAt: ' ',
      lines: [{barcode: '1', name: 'Milk', price: 2, quantity: 1}]
    })).to.throw(InvalidInvoiceError);
  });

  it('copies the lines and rounds the total to cents', () => {
    const input = [
      {barcode: '1', name: 'Milk', price: 0.1, quantity: 1},
      {barcode: '2', name: 'Bread', price: 0.2, quantity: 1}
    ];
    const invoice = issue(input, {orderId: 'order-1'});
    input[0].quantity = 9;
    input.push({barcode: '3', name: 'Tea', price: 1, quantity: 1});

    expect(invoice.invoiceNumber.formatted).to.equal('A/000001');
    expect(invoice.issuedAt).to.equal(issuedAt);
    expect(invoice.orderId).to.equal('order-1');
    expect(invoice.status).to.equal(InvoiceStatus.ISSUED);
    expect(invoice.cancelledAt).to.equal(null);
    expect(invoice.total).to.equal(0.3);
    expect(invoice.lines).to.deep.equal([
      {barcode: '1', name: 'Milk', price: 0.1, quantity: 1, amount: 0.1},
      {barcode: '2', name: 'Bread', price: 0.2, quantity: 1, amount: 0.2}
    ]);

    const returned = invoice.lines;
    returned[0].quantity = 4;
    returned.push({barcode: '3', name: 'Tea', price: 1, quantity: 1, amount: 1});
    expect(invoice.lines).to.have.lengthOf(2);
    expect(invoice.lines[0].quantity).to.equal(1);
    expect(invoice.total).to.equal(0.3);
  });

  it('accepts a fractional quantity and a zero price', () => {
    const weighed = issue([{barcode: '1', name: 'Ham', price: 2, quantity: 0.5}]);
    expect(weighed.lines[0].quantity).to.equal(0.5);
    expect(weighed.lines[0].amount).to.equal(1);
    expect(weighed.total).to.equal(1);

    const free = issue([{barcode: '2', name: 'Bag', price: 0, quantity: 1}]);
    expect(free.total).to.equal(0);
  });

  it('keeps the issued document when it is cancelled', () => {
    const invoice = issue([{barcode: '1', name: 'Milk', price: 2, quantity: 1}]);
    const lines = invoice.lines;

    invoice.cancel({cancelledAt: '2026-10-14T13:00:00.000Z'});

    expect(invoice.status).to.equal(InvoiceStatus.CANCELLED);
    expect(invoice.cancelledAt).to.equal('2026-10-14T13:00:00.000Z');
    expect(invoice.invoiceNumber.formatted).to.equal('A/000001');
    expect(invoice.issuedAt).to.equal(issuedAt);
    expect(invoice.total).to.equal(2);
    expect(invoice.lines).to.deep.equal(lines);
  });

  it('rejects a second cancellation and leaves the first time in place', () => {
    const invoice = issue([{barcode: '1', name: 'Milk', price: 2, quantity: 1}]);
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
