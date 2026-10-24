import {expect} from 'chai';
import {marginPercent} from '../../../../openMarket/domain/product/margin';

describe('marginPercent', () => {
  it('rounds the mockup margins half-up', () => {
    expect(marginPercent({priceCents: 120, baseCents: 70})).to.equal(42);
    expect(marginPercent({priceCents: 185, baseCents: 115})).to.equal(38);
  });

  it('is null when the price is zero', () => {
    expect(marginPercent({priceCents: 0, baseCents: 0})).to.equal(null);
    expect(marginPercent({priceCents: 0, baseCents: 70})).to.equal(null);
  });

  it('is zero when the cost equals the price', () => {
    expect(Object.is(marginPercent({priceCents: 100, baseCents: 100}), 0)).to.equal(true);
  });

  it('is negative when the cost is above the price', () => {
    expect(marginPercent({priceCents: 100, baseCents: 150})).to.equal(-50);
    expect(marginPercent({priceCents: 200, baseCents: 283})).to.equal(-41);
    expect(marginPercent({priceCents: 1000, baseCents: 1414})).to.equal(-41);
    expect(marginPercent({priceCents: 1000, baseCents: 1415})).to.equal(-41);
    expect(marginPercent({priceCents: 1000, baseCents: 1416})).to.equal(-42);
  });

  it('rounds a half percent up and keeps the neighbouring tenths', () => {
    expect(marginPercent({priceCents: 200, baseCents: 117})).to.equal(42);
    expect(marginPercent({priceCents: 1000, baseCents: 584})).to.equal(42);
    expect(marginPercent({priceCents: 1000, baseCents: 586})).to.equal(41);
    expect(marginPercent({priceCents: 100, baseCents: 50})).to.equal(50);
    expect(marginPercent({priceCents: 100, baseCents: 0})).to.equal(100);
  });

  it('is null for a non-integer or non-finite input', () => {
    expect(marginPercent({priceCents: 1.5, baseCents: 1})).to.equal(null);
    expect(marginPercent({priceCents: 100, baseCents: 1.5})).to.equal(null);
    expect(marginPercent({priceCents: Number.NaN, baseCents: 1})).to.equal(null);
    expect(marginPercent({priceCents: Number.POSITIVE_INFINITY, baseCents: 1})).to.equal(null);
    expect(marginPercent({priceCents: Number.NEGATIVE_INFINITY, baseCents: 1})).to.equal(null);
    expect(marginPercent({priceCents: '120', baseCents: 70})).to.equal(null);
    expect(marginPercent({priceCents: null, baseCents: 70})).to.equal(null);
    expect(marginPercent({priceCents: undefined, baseCents: 70})).to.equal(null);
    expect(marginPercent({})).to.equal(null);
    expect(marginPercent()).to.equal(null);
  });

  it('still divides a negative price', () => {
    expect(marginPercent({priceCents: -100, baseCents: -50})).to.equal(50);
  });
});
