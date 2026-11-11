import {expect} from 'chai';
import SettableClock from '../../../../openMarket/infrastructure/service/SettableClock';
import SystemClock from '../../../../openMarket/infrastructure/service/SystemClock';

describe('SettableClock', () => {
  it('reads the system time until it is moved, and again after resume', () => {
    const clock = new SettableClock({clock: new SystemClock({timeZone: 'Europe/Madrid'})});
    const before = Date.parse(clock.now());
    expect(Math.abs(before - Date.now())).to.be.below(5000);

    clock.moveTo(new Date('2026-07-01T08:30:00Z'));
    expect(clock.now()).to.equal('2026-07-01T08:30:00.000Z');
    expect(clock.zonedNow()).to.deep.equal({
      instant: '2026-07-01T08:30:00.000Z',
      local: '2026-07-01T10:30:00+02:00',
      date: '2026-07-01'
    });
    expect(clock.localDate({instant: '2026-12-31T23:30:00Z'})).to.equal('2027-01-01');
    expect(clock.zoned({instant: '2026-01-15T12:00:00Z'}).local).to.equal('2026-01-15T13:00:00+01:00');

    expect(clock.resume()).to.equal(clock);
    expect(Math.abs(Date.parse(clock.now()) - Date.now())).to.be.below(5000);
  });
});
