import {expect} from 'chai';
import {openMarketCompatibility} from '../../../../openMarket/infrastructure/plugins/semverRange';

describe('openMarketCompatibility', () => {
  it('matches a range that includes the app version', () => {
    expect(openMarketCompatibility({version: '1.15.0', range: '>=1.15.0 <2'})).to.deep.equal({
      ok: true,
      invalid: false
    });
  });

  it('rejects an app version outside the range', () => {
    expect(openMarketCompatibility({version: '1.14.0', range: '>=1.15.0 <2'}).ok).to.equal(false);
    expect(openMarketCompatibility({version: '2.0.0', range: '>=1.15.0 <2'}).ok).to.equal(false);
  });

  it('treats a missing range as compatible', () => {
    expect(openMarketCompatibility({version: '1.15.0', range: null})).to.deep.equal({
      ok: true,
      invalid: false
    });
    expect(openMarketCompatibility({version: '1.15.0', range: '  '}).ok).to.equal(true);
  });

  it('rejects a range that is not a version comparison', () => {
    expect(openMarketCompatibility({version: '1.15.0', range: 'latest'})).to.deep.equal({
      ok: false,
      invalid: true
    });
  });
});
