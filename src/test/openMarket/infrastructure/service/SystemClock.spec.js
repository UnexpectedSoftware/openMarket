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

  it('reads the Madrid calendar date of a UTC instant', () => {
    const clock = new SystemClock();

    expect(clock.localDate({instant: '2026-12-31T23:30:00.000Z'})).to.equal('2027-01-01');
    expect(clock.localDate({instant: '2026-10-14T12:00:00.000Z'})).to.equal('2026-10-14');
  });

  it('states the Madrid offset across the spring change', () => {
    const clock = new SystemClock();

    expect(clock.zoned({instant: '2026-03-29T00:59:59Z'}).local).to.equal('2026-03-29T01:59:59+01:00');
    expect(clock.zoned({instant: '2026-03-29T01:00:00Z'}).local).to.equal('2026-03-29T03:00:00+02:00');
  });

  it('gives New Year in Madrid its own date', () => {
    const zoned = new SystemClock().zoned({instant: '2026-12-31T23:30:00Z'});

    expect(zoned.date).to.equal('2027-01-01');
    expect(zoned.local).to.equal('2027-01-01T00:30:00+01:00');
    expect(zoned.date.slice(0, 4)).to.equal('2027');
  });
});
