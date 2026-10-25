import {expect} from 'chai';
import AppearancePreferences from '../../../../openMarket/domain/appearance/AppearancePreferences';
import AppearancePreferencesQuery from '../../../../openMarket/domain/appearance/AppearancePreferencesQuery';
import AppearancePreferencesView from '../../../../openMarket/domain/appearance/AppearancePreferencesView';
import Theme from '../../../../openMarket/domain/appearance/Theme';

describe('AppearancePreferencesQuery', () => {
  it('constructs and freezes an empty criteria value', () => {
    const query = new AppearancePreferencesQuery();
    expect(Object.isFrozen(query)).to.equal(true);
    expect(Object.keys(query)).to.deep.equal([]);
    expect(() => {
      query.theme = 'mercado';
    }).to.throw(TypeError);
  });
});

describe('AppearancePreferencesView', () => {
  it('freezes the Mercado default and stores the id string', () => {
    const view = new AppearancePreferencesView();
    expect(view).to.not.be.instanceof(AppearancePreferences);
    expect(view.theme).to.not.be.instanceof(Theme);
    expect(view.changeTheme).to.equal(undefined);
    expect(Object.isFrozen(view)).to.equal(true);
    expect(() => {
      view.theme = 'ultramarinos';
    }).to.throw(TypeError);
    expect(view.theme).to.equal('mercado');
    expect(new AppearancePreferencesView({theme: ''}).theme).to.equal('mercado');
    expect(new AppearancePreferencesView({theme: null}).theme).to.equal('mercado');
  });

  it('keeps the stored id and does not reject an unknown one', () => {
    expect(new AppearancePreferencesView({theme: 'ultramarinos'}).theme).to.equal('ultramarinos');
    expect(new AppearancePreferencesView({theme: 'not-a-theme'}).theme).to.equal('not-a-theme');
  });
});
