import {expect} from 'chai';
import {validateLine} from '../../../../openMarket/domain/order/lineValidity';
import ErrorCode from '../../../../openMarket/domain/error/ErrorCode';
import Quantity from '../../../../openMarket/domain/money/Quantity';
import Money from '../../../../openMarket/domain/money/Money';

describe('validateLine', () => {
  it('accepts a positive whole quantity', () => {
    expect(validateLine({quantity: 2, weighted: false})).to.deep.equal({valid: true});
    expect(validateLine({quantity: Quantity.from(1)}).valid).to.equal(true);
  });

  it('rejects zero, blank, and a non-number', () => {
    expect(validateLine({quantity: 0}).code).to.equal(ErrorCode.ORDER_QUANTITY_INVALID);
    expect(validateLine({quantity: ''}).code).to.equal(ErrorCode.ORDER_QUANTITY_INVALID);
    expect(validateLine({quantity: 'aaaa'}).code).to.equal(ErrorCode.ORDER_QUANTITY_INVALID);
    expect(validateLine(null).valid).to.equal(false);
  });

  it('rejects a fraction only when the product is not weighted', () => {
    expect(validateLine({quantity: 0.5, weighted: false}).code).to.equal(ErrorCode.ORDER_LINE_INVALID);
    expect(validateLine({quantity: 0.5, weighted: true}).valid).to.equal(true);
    expect(validateLine({quantity: 0.5}).valid).to.equal(true);
  });

  it('rejects a free line that is not a positive amount', () => {
    expect(validateLine({kind: 'FREE', amount: 0}).code).to.equal(ErrorCode.ORDER_LINE_INVALID);
    expect(validateLine({kind: 'FREE', amount: Money.from('3.50')}).valid).to.equal(true);
  });
});
