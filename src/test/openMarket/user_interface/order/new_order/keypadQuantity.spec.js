import {expect} from 'chai';
import {nextKeypadQuantity} from '../../../../../openMarket/user_interface/order/new_order/keypadQuantity';

describe('nextKeypadQuantity', () => {
  it('appends digits, replaces a zero, and stops at six digits', () => {
    expect(nextKeypadQuantity(null, '4')).to.equal('4');
    expect(nextKeypadQuantity('', '4')).to.equal('4');
    expect(nextKeypadQuantity('0', '8')).to.equal('8');
    expect(nextKeypadQuantity('1', '2')).to.equal('12');
    expect(nextKeypadQuantity('999999', '1')).to.equal('999999');
    expect(nextKeypadQuantity(12, '3')).to.equal('123');
  });

  it('clears, deletes, and ignores a key that is not a digit', () => {
    expect(nextKeypadQuantity('12', 'clear')).to.equal('0');
    expect(nextKeypadQuantity('12', 'back')).to.equal('1');
    expect(nextKeypadQuantity('7', 'back')).to.equal('0');
    expect(nextKeypadQuantity('0', 'back')).to.equal('0');
    expect(nextKeypadQuantity('12', 'x')).to.equal('12');
    expect(nextKeypadQuantity('12', '10')).to.equal('12');
    expect(nextKeypadQuantity('12', null)).to.equal('12');
  });
});
