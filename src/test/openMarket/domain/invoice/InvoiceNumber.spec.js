import {expect} from 'chai';
import InvoiceNumber from '../../../../openMarket/domain/invoice/InvoiceNumber';
import InvalidInvoiceNumberError from '../../../../openMarket/domain/invoice/InvalidInvoiceNumberError';
import ErrorCode from '../../../../openMarket/domain/error/ErrorCode';

describe('InvoiceNumber', () => {
  it('formats a letter series and a year series', () => {
    expect(new InvoiceNumber({series: 'A', number: 123}).formatted).to.equal('A/000123');
    expect(new InvoiceNumber({series: '2026', number: 123}).formatted).to.equal('2026/000123');
  });

  it('does not truncate a number wider than six digits', () => {
    expect(new InvoiceNumber({series: 'A', number: 1000000}).formatted).to.equal('A/1000000');
  });

  it('rejects a series that would break the formatted number', () => {
    expect(() => new InvoiceNumber({series: 'A/1', number: 1})).to.throw(InvalidInvoiceNumberError);
    expect(() => new InvoiceNumber({series: '', number: 1})).to.throw(InvalidInvoiceNumberError);
    expect(() => new InvoiceNumber({series: 'has space', number: 1})).to.throw(InvalidInvoiceNumberError);
    try {
      new InvoiceNumber({series: 'A/1', number: 1});
    } catch (error) {
      expect(error.code).to.equal(ErrorCode.INVOICE_NUMBER_INVALID);
    }
  });

  it('rejects a number that is not a positive integer', () => {
    expect(() => new InvoiceNumber({series: 'A', number: 0})).to.throw('Invoice number is not valid');
    expect(() => new InvoiceNumber({series: 'A', number: 1.5})).to.throw(InvalidInvoiceNumberError);
    expect(() => new InvoiceNumber({series: 'A', number: -1})).to.throw(InvalidInvoiceNumberError);
  });
});
