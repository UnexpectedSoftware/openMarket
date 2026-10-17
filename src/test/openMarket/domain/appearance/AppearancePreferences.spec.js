import {expect} from 'chai';
import AppearancePreferences from '../../../../openMarket/domain/appearance/AppearancePreferences';
import Theme from '../../../../openMarket/domain/appearance/Theme';
import ErrorCode from '../../../../openMarket/domain/error/ErrorCode';

describe('AppearancePreferences', () => {
  it('starts on Mercado and changes theme on the aggregate', () => {
    const preferences = AppearancePreferences.defaults();
    expect(preferences.theme.id).to.equal('mercado');
    preferences.changeTheme({theme: 'unexpected-neon'});
    expect(preferences.theme.equals(Theme.of('unexpected-neon'))).to.equal(true);
  });

  it('rejects an unknown theme', () => {
    const preferences = AppearancePreferences.defaults();
    expect(() => preferences.changeTheme({theme: 'nope'}))
      .to.throw(Error)
      .with.property('code', ErrorCode.THEME_INVALID);
    expect(preferences.theme.id).to.equal('mercado');
  });
});
