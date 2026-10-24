import {expect} from 'chai';
import * as Rx from 'rxjs';
import savedThemeId from '../../../../openMarket/user_interface/appearance/savedThemeId';

describe('savedThemeId', () => {
  it('reads a string theme', () => {
    const themeId = savedThemeId({
      get: () => Rx.Observable.of({theme: 'ultramarinos'})
    });
    expect(themeId).to.equal('ultramarinos');
  });

  it('stays on Mercado when the read fails', () => {
    expect(savedThemeId({
      get: () => Rx.Observable.throw(new Error('disk'))
    })).to.equal('mercado');
    expect(savedThemeId({
      get: () => {
        throw new Error('down');
      }
    })).to.equal('mercado');
  });
});
