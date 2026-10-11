import {expect} from 'chai';
import SystemClock from '../../../../openMarket/infrastructure/service/SystemClock';

describe('SystemClock', () => {
  it('returns the current time as an ISO-8601 UTC string', () => {
    const before = Date.now();
    const stamp = new SystemClock().now();
    const after = Date.now();
    const parsed = Date.parse(stamp);

    expect(stamp).to.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    expect(parsed).to.be.at.least(before);
    expect(parsed).to.be.at.most(after);
  });
});
