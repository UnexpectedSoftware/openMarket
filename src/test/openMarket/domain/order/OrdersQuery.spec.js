import {expect} from 'chai';
import OrdersQuery from '../../../../openMarket/domain/order/OrdersQuery';

describe('OrdersQuery', () => {
  it('stores the criteria and does not check the range', () => {
    const query = new OrdersQuery({
      from: '2026-10-22 00:00:00',
      to: '2026-10-21 00:00:00',
      limit: 20,
      offset: 0
    });
    expect(Object.isFrozen(query)).to.equal(true);
    expect(query.from).to.equal('2026-10-22 00:00:00');
    expect(query.to).to.equal('2026-10-21 00:00:00');
    expect(query.limit).to.equal(20);
    expect(query.offset).to.equal(0);
    expect(() => {
      query.limit = 1;
    }).to.throw(TypeError);
  });

  it('leaves an omitted page size unset', () => {
    const query = new OrdersQuery({from: 'a', to: 'b'});
    expect(query.limit).to.equal(undefined);
    expect(query.offset).to.equal(undefined);
  });
});
