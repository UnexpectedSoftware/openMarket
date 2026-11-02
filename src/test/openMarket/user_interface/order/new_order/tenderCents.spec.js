import {expect} from 'chai';
import {nextTenderCents} from '../../../../../openMarket/user_interface/order/new_order/tenderCents';

describe('nextTenderCents', () => {
  it('appends digits and two zeros, and drops the last digit', () => {
    expect(nextTenderCents(0, '1')).to.equal(1);
    expect(nextTenderCents(1, '3')).to.equal(13);
    expect(nextTenderCents(13, '00')).to.equal(1300);
    expect(nextTenderCents(1300, 'back')).to.equal(130);
    expect(nextTenderCents(0, 'back')).to.equal(0);
    expect(nextTenderCents(5, 'nope')).to.equal(5);
  });

  it('stops at eight digits', () => {
    expect(nextTenderCents(99999999, '1')).to.equal(99999999);
    expect(nextTenderCents(1000000, '00')).to.equal(1000000);
  });
});
