import {expect} from 'chai';
import LanguagePreferences from '../../../../openMarket/domain/shop/LanguagePreferences';
import LanguagePreferencesQuery from '../../../../openMarket/domain/shop/LanguagePreferencesQuery';
import LanguagePreferencesView from '../../../../openMarket/domain/shop/LanguagePreferencesView';

describe('LanguagePreferencesQuery', () => {
  it('constructs and freezes an empty criteria value', () => {
    const query = new LanguagePreferencesQuery();
    expect(Object.isFrozen(query)).to.equal(true);
    expect(Object.keys(query)).to.deep.equal([]);
    expect(() => {
      query.locale = 'en';
    }).to.throw(TypeError);
  });
});

describe('LanguagePreferencesView', () => {
  it('freezes the default and does not build the aggregate', () => {
    const view = new LanguagePreferencesView();
    expect(view).to.not.be.instanceof(LanguagePreferences);
    expect(view.withLocale).to.equal(undefined);
    expect(Object.isFrozen(view)).to.equal(true);
    expect(() => {
      view.locale = 'en';
    }).to.throw(TypeError);
    expect(view.locale).to.equal('es');
  });

  it('stores the given locale and does not check it', () => {
    const view = new LanguagePreferencesView({locale: 'en'});
    expect(view.locale).to.equal('en');
    expect(new LanguagePreferencesView({locale: ''}).locale).to.equal('');
  });
});
