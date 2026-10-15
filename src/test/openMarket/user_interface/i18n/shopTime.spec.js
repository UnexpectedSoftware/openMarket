import {expect} from 'chai';
import {shopMoment} from '../../../../openMarket/user_interface/i18n/shopTime';

describe('shopMoment', () => {
  it('uses the Madrid calendar day when UTC is still the day before', () => {
    const now = shopMoment(new Date('2026-10-15T22:48:00Z'));

    expect(now.format('YYYY-MM-DD HH:mm:ss')).to.equal('2026-10-16 00:48:00');
    expect(now.clone().startOf('month').format('YYYY-MM-DD HH:mm:ss')).to.equal('2026-10-01 00:00:00');
    expect(now.clone().endOf('day').format('YYYY-MM-DD HH:mm:ss')).to.equal('2026-10-16 23:59:59');
  });
});
