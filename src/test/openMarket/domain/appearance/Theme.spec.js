import {expect} from 'chai';
import Theme from '../../../../openMarket/domain/appearance/Theme';
import InvalidThemeError from '../../../../openMarket/domain/appearance/InvalidThemeError';
import ErrorCode from '../../../../openMarket/domain/error/ErrorCode';

describe('Theme', () => {
  it('accepts the four installed ids and defaults to Mercado', () => {
    expect(Theme.ids()).to.deep.equal([
      'mercado',
      'mostrador-noche',
      'ultramarinos',
      'unexpected-neon'
    ]);
    expect(Theme.DEFAULT.id).to.equal('mercado');
    expect(Theme.of('ultramarinos').equals(Theme.of('ultramarinos'))).to.equal(true);
    expect(Theme.of('ultramarinos').equals('mercado')).to.equal(false);
  });

  it('rejects an unknown id', () => {
    expect(() => Theme.of('pastel')).to.throw(InvalidThemeError)
      .with.property('code', ErrorCode.THEME_INVALID);
  });
});
