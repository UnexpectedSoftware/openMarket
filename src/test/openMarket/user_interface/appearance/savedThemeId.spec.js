import {expect} from 'chai';
import * as Rx from 'rxjs';
import savedThemeId, {savedLayoutId} from '../../../../openMarket/user_interface/appearance/savedThemeId';

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

  it('reads a known layout and stays on Mostrador otherwise', () => {
    expect(savedLayoutId({
      get: () => Rx.Observable.of({layout: 'tactil'})
    })).to.equal('tactil');
    expect(savedLayoutId({
      get: () => Rx.Observable.of({layout: 'pastel'})
    })).to.equal('mostrador');
    expect(savedLayoutId({
      get: () => Rx.Observable.of(null)
    })).to.equal('mostrador');
    expect(savedLayoutId({
      get: () => Rx.Observable.throw(new Error('disk'))
    })).to.equal('mostrador');
    expect(savedLayoutId({
      get: () => {
        throw new Error('down');
      }
    })).to.equal('mostrador');
  });
});
