import {expect} from 'chai';
import SellLayout from '../../../../openMarket/domain/appearance/SellLayout';
import InvalidSellLayoutError from '../../../../openMarket/domain/appearance/InvalidSellLayoutError';
import ErrorCode from '../../../../openMarket/domain/error/ErrorCode';

describe('SellLayout', () => {
  it('accepts the three presets and defaults to Mostrador', () => {
    expect(SellLayout.ids()).to.deep.equal(['mostrador', 'escaner', 'tactil']);
    const ids = SellLayout.ids();
    ids.push('extra');
    expect(SellLayout.ids()).to.deep.equal(['mostrador', 'escaner', 'tactil']);
    expect(SellLayout.DEFAULT.id).to.equal('mostrador');
    expect(SellLayout.of('escaner').equals(SellLayout.of('escaner'))).to.equal(true);
    expect(SellLayout.of('escaner').equals('escaner')).to.equal(true);
    expect(SellLayout.of('escaner').equals('tactil')).to.equal(false);
    expect(SellLayout.of('escaner').equals(null)).to.equal(false);
  });

  it('rejects an unknown id', () => {
    expect(() => SellLayout.of('pastel')).to.throw(InvalidSellLayoutError)
      .with.property('code', ErrorCode.SELL_LAYOUT_INVALID);
    expect(() => SellLayout.of('')).to.throw(InvalidSellLayoutError);
    expect(() => SellLayout.of(null)).to.throw(InvalidSellLayoutError);
    expect(new InvalidSellLayoutError().code).to.equal(ErrorCode.SELL_LAYOUT_INVALID);
    expect(new InvalidSellLayoutError({layout: 'pastel'}).message).to.contain('pastel');
  });

  it('paints Mostrador when the stored id is missing or unknown', () => {
    expect(SellLayout.orDefault(null)).to.equal('mostrador');
    expect(SellLayout.orDefault(undefined)).to.equal('mostrador');
    expect(SellLayout.orDefault('')).to.equal('mostrador');
    expect(SellLayout.orDefault('pastel')).to.equal('mostrador');
    expect(SellLayout.orDefault('escaner')).to.equal('escaner');
    expect(SellLayout.orDefault('tactil')).to.equal('tactil');
    expect(SellLayout.orDefault('mostrador')).to.equal('mostrador');
  });
});
