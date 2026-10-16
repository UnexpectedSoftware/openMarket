import {expect} from 'chai';
import {receiptBlock} from '../../../../openMarket/domain/receipt/ReceiptBlock';
import ErrorCode from '../../../../openMarket/domain/error/ErrorCode';

describe('ReceiptBlock', () => {
  it('rejects a QR that is the wrong size or correction', () => {
    expect(() => receiptBlock({type: 'qr', data: 'abc', sizeMm: 29, correction: 'M'}))
      .to.throw(Error).with.property('code', ErrorCode.RECEIPT_BLOCK_INVALID);
    expect(() => receiptBlock({type: 'qr', data: 'abc', sizeMm: 35, correction: 'L'}))
      .to.throw(Error).with.property('code', ErrorCode.RECEIPT_BLOCK_INVALID);
    expect(receiptBlock({type: 'qr', data: 'abc', sizeMm: 40, correction: 'M'}).sizeMm).to.equal(40);
  });
});
