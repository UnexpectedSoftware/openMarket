import {expect} from 'chai';
import Money from '../../../../openMarket/domain/money/Money';
import Quantity from '../../../../openMarket/domain/money/Quantity';
import InvalidMoneyError from '../../../../openMarket/domain/money/InvalidMoneyError';
import ErrorCode from '../../../../openMarket/domain/error/ErrorCode';

describe('Money', () => {
  it('rounds 18.50 € times 0.350 kg half-up to 6.48 €', () => {
    const amount = Money.fromEuros('18.50').times(Quantity.fromDecimal('0.350'));

    expect(amount.cents).to.equal(648);
    expect(amount.toEuros()).to.equal(6.48);
  });

  it('prices three units of 0.90 € as 2.70 €', () => {
    expect(Money.fromEuros('0.90').times(Quantity.fromDecimal(3)).cents).to.equal(270);
  });

  it('parses a decimal string half-up without multiplying a float', () => {
    expect(Money.fromEuros('1.005').cents).to.equal(101);
    expect(Money.fromEuros('1.004').cents).to.equal(100);
    expect(Money.fromEuros(1.005).cents).to.equal(101);
  });

  it('adds 0.10 and 0.20 as 0.30', () => {
    const total = Money.fromEuros('0.10').plus(Money.fromEuros('0.20'));

    expect(total.cents).to.equal(30);
    expect(total.equals(Money.fromEuros('0.30'))).to.equal(true);
  });

  it('sums rounded lines instead of rounding the sum', () => {
    let total = Money.ofCents(0);
    let rounded = 0;
    for (let index = 0; index < 1000; index += 1) {
      const price = Money.ofCents((index % 50) + 1);
      const quantity = Quantity.ofMilli((index % 7) * 125 + 50);
      const line = price.times(quantity);
      total = total.plus(line);
      rounded += line.cents;
    }
    expect(total.cents).to.equal(rounded);
  });

  it('rejects a fractional cent and a value that is not a number', () => {
    expect(() => Money.ofCents(1.5)).to.throw(InvalidMoneyError);
    expect(() => Money.ofCents(NaN)).to.throw(InvalidMoneyError);
    try {
      Money.ofCents(1.5);
    } catch (error) {
      expect(error.code).to.equal(ErrorCode.MONEY_INVALID);
    }
    expect(() => Money.fromEuros('nope')).to.throw(InvalidMoneyError);
  });
});

describe('Quantity', () => {
  it('stores one piece as 1000 milli-units and 0.350 kg as 350', () => {
    expect(Quantity.fromDecimal(1).milli).to.equal(1000);
    expect(Quantity.fromDecimal('0.350').milli).to.equal(350);
    expect(Quantity.fromDecimal('0.350').units).to.equal(0.35);
  });

  it('rejects a fractional milli-unit', () => {
    expect(() => Quantity.ofMilli(1.5)).to.throw(InvalidMoneyError);
  });
});
