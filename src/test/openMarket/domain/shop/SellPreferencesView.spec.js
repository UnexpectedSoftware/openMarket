import {expect} from 'chai';
import SellPreferences from '../../../../openMarket/domain/shop/SellPreferences';
import SellPreferencesQuery from '../../../../openMarket/domain/shop/SellPreferencesQuery';
import SellPreferencesView from '../../../../openMarket/domain/shop/SellPreferencesView';

describe('SellPreferencesQuery', () => {
  it('constructs and freezes an empty criteria value', () => {
    const query = new SellPreferencesQuery();
    expect(Object.isFrozen(query)).to.equal(true);
    expect(Object.keys(query)).to.deep.equal([]);
    expect(() => {
      query.autoPrint = true;
    }).to.throw(TypeError);
  });
});

describe('SellPreferencesView', () => {
  it('freezes the default and does not build the aggregate', () => {
    const view = new SellPreferencesView();
    expect(view).to.not.be.instanceof(SellPreferences);
    expect(view.withAutoPrint).to.equal(undefined);
    expect(Object.isFrozen(view)).to.equal(true);
    expect(() => {
      view.autoPrint = true;
    }).to.throw(TypeError);
    expect(view.autoPrint).to.equal(false);
  });

  it('stores auto-print only when the flag is true', () => {
    expect(new SellPreferencesView({autoPrint: true}).autoPrint).to.equal(true);
    expect(new SellPreferencesView({autoPrint: false}).autoPrint).to.equal(false);
  });
});
