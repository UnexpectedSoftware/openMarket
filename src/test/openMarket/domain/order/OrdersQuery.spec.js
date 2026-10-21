import {expect} from 'chai';
import OrdersQuery from '../../../../openMarket/domain/order/OrdersQuery';

describe('OrdersQuery', () => {
  const port = new OrdersQuery();

  it('requires an adapter for list', () => {
    expect(() => port.list({from: 'a', to: 'b'})).to.throw('OrdersQuery#list must be implemented');
  });

  it('requires an adapter for daySummary', () => {
    expect(() => port.daySummary({from: 'a', to: 'b'})).to.throw('OrdersQuery#daySummary must be implemented');
  });
});
