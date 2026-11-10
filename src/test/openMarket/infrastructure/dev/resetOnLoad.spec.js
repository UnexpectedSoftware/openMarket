import { expect } from 'chai';
import { resetOnLoadFrom } from '../../../../openMarket/infrastructure/dev/index';

describe('Reset on load', () => {
  it('asks the bridge only in development', () => {
    let reads = 0;
    const readFlag = () => {
      reads += 1;
      return true;
    };
    expect(resetOnLoadFrom('production', readFlag)).to.equal(false);
    expect(resetOnLoadFrom('test', readFlag)).to.equal(false);
    expect(reads).to.equal(0);
    expect(resetOnLoadFrom('development', readFlag)).to.equal(true);
    expect(resetOnLoadFrom('development', () => false)).to.equal(false);
    expect(resetOnLoadFrom('development', () => {
      throw new Error('no window');
    })).to.equal(false);
  });
});