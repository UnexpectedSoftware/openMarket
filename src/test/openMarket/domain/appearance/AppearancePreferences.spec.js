import {expect} from 'chai';
import AppearancePreferences from '../../../../openMarket/domain/appearance/AppearancePreferences';
import SellLayout from '../../../../openMarket/domain/appearance/SellLayout';
import Theme from '../../../../openMarket/domain/appearance/Theme';
import ErrorCode from '../../../../openMarket/domain/error/ErrorCode';

describe('AppearancePreferences', () => {
  it('starts on Mercado and Mostrador and changes each on the aggregate', () => {
    const preferences = AppearancePreferences.defaults();
    expect(preferences.theme.id).to.equal('mercado');
    expect(preferences.layout.id).to.equal('mostrador');
    preferences.changeTheme({theme: 'unexpected-neon'});
    expect(preferences.theme.equals(Theme.of('unexpected-neon'))).to.equal(true);
    expect(preferences.layout.id).to.equal('mostrador');
    preferences.changeLayout({layout: 'tactil'});
    expect(preferences.layout.equals(SellLayout.of('tactil'))).to.equal(true);
    expect(preferences.theme.id).to.equal('unexpected-neon');
    preferences.changeLayout({layout: SellLayout.of('escaner')});
    expect(preferences.layout.id).to.equal('escaner');
    preferences.changeTheme({theme: Theme.of('mercado')});
    expect(preferences.layout.id).to.equal('escaner');
  });

  it('treats a missing layout as Mostrador and rejects an unknown one', () => {
    expect(new AppearancePreferences({theme: 'mercado'}).layout.id).to.equal('mostrador');
    expect(new AppearancePreferences({theme: 'mercado', layout: ''}).layout.id).to.equal('mostrador');
    expect(new AppearancePreferences({theme: 'mercado', layout: null}).layout.id).to.equal('mostrador');
    expect(new AppearancePreferences({theme: Theme.of('mercado'), layout: SellLayout.of('tactil')}).layout.id)
      .to.equal('tactil');
    const preferences = AppearancePreferences.defaults();
    expect(() => preferences.changeLayout({layout: 'nope'}))
      .to.throw(Error)
      .with.property('code', ErrorCode.SELL_LAYOUT_INVALID);
    expect(preferences.layout.id).to.equal('mostrador');
    expect(() => preferences.changeLayout({layout: ''})).to.throw(Error);
    expect(preferences.layout.id).to.equal('mostrador');
  });

  it('rejects an unknown theme', () => {
    const preferences = AppearancePreferences.defaults();
    expect(() => preferences.changeTheme({theme: 'nope'}))
      .to.throw(Error)
      .with.property('code', ErrorCode.THEME_INVALID);
    expect(preferences.theme.id).to.equal('mercado');
    expect(preferences.layout.id).to.equal('mostrador');
  });
});
