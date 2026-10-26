import {expect} from 'chai';
import ErrorCode from '../../../../openMarket/domain/error/ErrorCode';
import InvalidLanguageError from '../../../../openMarket/domain/shop/InvalidLanguageError';
import LanguagePreferences from '../../../../openMarket/domain/shop/LanguagePreferences';

describe('LanguagePreferences', () => {
  it('defaults to es', () => {
    const preferences = LanguagePreferences.defaults();
    expect(preferences.locale).to.equal('es');
    expect(new LanguagePreferences({}).locale).to.equal('es');
    expect(new LanguagePreferences({locale: undefined}).locale).to.equal('es');
    const again = preferences.withLocale('es');
    expect(again).to.not.equal(preferences);
    expect(again.locale).to.equal('es');
    expect(preferences.locale).to.equal('es');
  });

  it('rejects en and any other locale', () => {
    const original = LanguagePreferences.defaults();
    try {
      original.withLocale('en');
      expect.fail('en should throw');
    } catch (error) {
      expect(error).to.be.instanceof(InvalidLanguageError);
      expect(error.code).to.equal(ErrorCode.LANGUAGE_INVALID);
      expect(error.context.locale).to.equal('en');
      expect(error.level).to.equal('warn');
    }
    expect(original.locale).to.equal('es');
    expect(() => new LanguagePreferences({locale: 'en'})).to.throw(InvalidLanguageError);
    expect(() => new LanguagePreferences({locale: ''})).to.throw(InvalidLanguageError);
    expect(() => new LanguagePreferences({locale: 'ES'})).to.throw(InvalidLanguageError);
    expect(() => original.withLocale(null)).to.throw(InvalidLanguageError)
      .with.property('code', ErrorCode.LANGUAGE_INVALID);
  });
});
