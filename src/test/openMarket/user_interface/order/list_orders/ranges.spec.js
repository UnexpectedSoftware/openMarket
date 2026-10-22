import {expect} from 'chai';
import {customRange, customRangeMessage, rangeFor} from '../../../../../openMarket/user_interface/order/list_orders/ranges';

const MADRID = 'Europe/Madrid';

describe('rangeFor', () => {
  const evening = new Date('2026-10-15T22:48:00Z');

  it('uses the Madrid day when UTC is still the day before', () => {
    expect(rangeFor('today', evening, MADRID)).to.deep.equal({
      from: '2026-10-16 00:00:00',
      to: '2026-10-16 23:59:59'
    });
    expect(rangeFor('yesterday', evening, MADRID)).to.deep.equal({
      from: '2026-10-15 00:00:00',
      to: '2026-10-15 23:59:59'
    });
    expect(rangeFor('week', evening, MADRID)).to.deep.equal({
      from: '2026-10-10 00:00:00',
      to: '2026-10-16 23:59:59'
    });
    expect(rangeFor('month', evening, MADRID)).to.deep.equal({
      from: '2026-10-01 00:00:00',
      to: '2026-10-16 00:48:00'
    });
  });

  it('follows the time zone argument', () => {
    expect(rangeFor('today', evening, 'UTC').from).to.equal('2026-10-15 00:00:00');
  });

  it('keeps the calendar day across the spring-forward gap', () => {
    const before = new Date('2026-03-28T23:30:00Z');
    const afterGap = new Date('2026-03-29T01:30:00Z');
    expect(rangeFor('today', before, MADRID)).to.deep.equal({
      from: '2026-03-29 00:00:00',
      to: '2026-03-29 23:59:59'
    });
    expect(rangeFor('today', afterGap, MADRID)).to.deep.equal({
      from: '2026-03-29 00:00:00',
      to: '2026-03-29 23:59:59'
    });
  });

  it('keeps the calendar day across the autumn fallback', () => {
    const start = new Date('2026-10-24T22:30:00Z');
    const repeated = new Date('2026-10-25T01:30:00Z');
    expect(rangeFor('today', start, MADRID).from).to.equal('2026-10-25 00:00:00');
    expect(rangeFor('today', repeated, MADRID)).to.deep.equal({
      from: '2026-10-25 00:00:00',
      to: '2026-10-25 23:59:59'
    });
  });

  it('rejects an unknown key', () => {
    expect(() => rangeFor('year', evening, MADRID)).to.throw('Unknown order range: year');
  });
});

describe('customRange', () => {
  it('covers both chosen days', () => {
    expect(customRange('2026-10-01', '2026-10-21')).to.deep.equal({
      from: '2026-10-01 00:00:00',
      to: '2026-10-21 23:59:59'
    });
  });

  it('asks for both dates and rejects an inverted range', () => {
    expect(customRangeMessage('', '2026-10-21')).to.equal('Elige las dos fechas');
    expect(customRangeMessage('2026-10-21', '')).to.equal('Elige las dos fechas');
    expect(customRangeMessage('2026-10-21', '2026-10-01')).to.equal('La fecha inicial es posterior a la final');
    expect(customRangeMessage('2026-10-01', '2026-10-21')).to.equal('');
  });
});
