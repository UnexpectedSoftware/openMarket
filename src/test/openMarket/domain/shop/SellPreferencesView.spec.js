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
      query.printMode = 'always';
    }).to.throw(TypeError);
  });
});

describe('SellPreferencesView', () => {
  it('freezes the default and does not build the aggregate', () => {
    const view = new SellPreferencesView();
    expect(view).to.not.be.instanceof(SellPreferences);
    expect(view.withPrintMode).to.equal(undefined);
    expect(view.withAutoPrint).to.equal(undefined);
    expect(view.autoPrint).to.equal(undefined);
    expect(Object.isFrozen(view)).to.equal(true);
    expect(() => {
      view.printMode = 'always';
    }).to.throw(TypeError);
    expect(view.printMode).to.equal('ask');
    expect(view.headerText).to.equal('');
    expect(view.footerText).to.equal('');
    expect(view.paperWidthMm).to.equal(80);
  });

  it('stores the given fields and does not check them', () => {
    const header = 'a'.repeat(81);
    const view = new SellPreferencesView({
      printMode: 'never',
      headerText: header,
      footerText: 'Pie',
      paperWidthMm: 58
    });
    expect(view.printMode).to.equal('never');
    expect(view.headerText).to.equal(header);
    expect(view.footerText).to.equal('Pie');
    expect(view.paperWidthMm).to.equal(58);
    expect(new SellPreferencesView({printMode: 'always', paperWidthMm: 80}).printMode).to.equal('always');
  });
});
