import {expect} from 'chai';
import {openMarketCompatibility} from '../../../../openMarket/domain/plugin/openMarketCompatibility';

function check(version, range) {
  return openMarketCompatibility({version, range});
}

describe('openMarketCompatibility', () => {
  it('matches a range that includes the app version', () => {
    expect(check('1.15.0', '>=1.15.0 <2')).to.deep.equal({ok: true, invalid: false});
    expect(check('1.16.0', '>=1.15.0 <2')).to.deep.equal({ok: true, invalid: false});
    expect(check('1.15.0', '>=1.15.0 <2.0.0 >1.0.0 <=1.15.0')).to.deep.equal({ok: true, invalid: false});
  });

  it('rejects an app version outside the range', () => {
    expect(check('1.14.0', '>=1.15.0 <2')).to.deep.equal({ok: false, invalid: false});
    expect(check('2.0.0', '>=1.15.0 <2')).to.deep.equal({ok: false, invalid: false});
    expect(check('1.15.1', '<=1.15.0')).to.deep.equal({ok: false, invalid: false});
    expect(check('1.15.0', '>1.15.0')).to.deep.equal({ok: false, invalid: false});
    expect(check('1.15.0', '<1.15.0')).to.deep.equal({ok: false, invalid: false});
    expect(check('1.15.1', '=1.15.0')).to.deep.equal({ok: false, invalid: false});
  });

  it('matches each comparator on its boundary and a version that differs in one part', () => {
    expect(check('1.15.1', '>1.15.0').ok).to.equal(true);
    expect(check('1.14.0', '<1.15.0').ok).to.equal(true);
    expect(check('1.15.0', '<=1.15.0').ok).to.equal(true);
    expect(check('1.15.0', '=1.15.0').ok).to.equal(true);
    expect(check('1.15.0', '1.15.0').ok).to.equal(true);
    expect(check('1.15.1', '1.15.0').ok).to.equal(false);
    expect(check('1.16.0', '>=1.15.0').ok).to.equal(true);
    expect(check('2.0.0', '>=1.0.0').ok).to.equal(true);
    expect(check('2.0.0', '=1.0.0').ok).to.equal(false);
    expect(check('1.16.0', '=1.15.0').ok).to.equal(false);
    expect(check('1.15.0', '<1.15.1').ok).to.equal(true);
    expect(check('1.15.1', '=1.15.0').ok).to.equal(false);
    expect(check('1.15.0', '>=1.15.1').ok).to.equal(false);
  });

  it('treats a missing or blank range as compatible', () => {
    expect(check('1.15.0', null)).to.deep.equal({ok: true, invalid: false});
    expect(check('1.15.0', undefined)).to.deep.equal({ok: true, invalid: false});
    expect(check('1.15.0', '  ').ok).to.equal(true);
    expect(check('1.15.0', '').ok).to.equal(true);
  });

  it('fills omitted minor and patch with zero and trims the app version', () => {
    expect(check('1', '=1.0.0')).to.deep.equal({ok: true, invalid: false});
    expect(check('1.2', '=1.2.0')).to.deep.equal({ok: true, invalid: false});
    expect(check(' 1.15.0 ', '=1.15.0')).to.deep.equal({ok: true, invalid: false});
    expect(check('1.2', '=1.2.1').ok).to.equal(false);
    expect(check('1.2.0', '=1.0.0').ok).to.equal(false);
  });

  it('matches one alternative and requires every comparator in the chosen group', () => {
    expect(check('2.0.0', '1.0.0 || 2.0.0')).to.deep.equal({ok: true, invalid: false});
    expect(check('1.5.0', '1.0.0 || 2.0.0')).to.deep.equal({ok: false, invalid: false});
    expect(check('2.1.0', '>=1.0.0 <1.5.0 || >=2.0.0 <3.0.0').ok).to.equal(true);
    expect(check('1.2.0', '>=1.0.0 <1.5.0 || >=2.0.0 <3.0.0').ok).to.equal(true);
    expect(check('1.7.0', '>=1.0.0 <1.5.0 || >=2.0.0 <3.0.0').ok).to.equal(false);
    expect(check('1.1.0', '>=1.0.0 <2.0.0 >1.2.0').ok).to.equal(false);
    expect(check('1.5.0', '>=1.0.0 ||').ok).to.equal(true);
  });

  it('rejects a range or an app version that is not a version comparison', () => {
    expect(check('1.15.0', 'latest')).to.deep.equal({ok: false, invalid: true});
    expect(check('1.15.0', '>= 1.0.0')).to.deep.equal({ok: false, invalid: true});
    expect(check('1.15.0', '>=1.0.0 nope')).to.deep.equal({ok: false, invalid: true});
    expect(check('1.5.0', '>=1.0.0 || nope')).to.deep.equal({ok: false, invalid: true});
    expect(check('1.5.0', 'nope || >=1.0.0')).to.deep.equal({ok: false, invalid: true});
    expect(check('1.15.0', '||')).to.deep.equal({ok: false, invalid: true});
    expect(check('1.15.0', '  ||  ')).to.deep.equal({ok: false, invalid: true});
    expect(check('nope', '>=1')).to.deep.equal({ok: false, invalid: true});
    expect(check('1.15.0-beta', '>=1')).to.deep.equal({ok: false, invalid: true});
    expect(check('1.2.3.4', '=1.2.3')).to.deep.equal({ok: false, invalid: true});
  });
});
