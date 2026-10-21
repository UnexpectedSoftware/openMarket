import {expect} from 'chai';
import Order from '../../../../openMarket/domain/order/Order';
import OrderView from '../../../../openMarket/domain/order/OrderView';
import OrderRangeSummary from '../../../../openMarket/domain/order/OrderRangeSummary';
import OrderRepository from '../../../../openMarket/domain/order/OrderRepository';

describe('OrderView', () => {
  it('keeps the stored row and does not apply sale rules', () => {
    const view = new OrderView({
      orderId: 'bare',
      invoiceNumber: '—',
      createdAt: '2026-10-21T08:00:00',
      itemCount: 0,
      paymentMethod: null,
      totalCents: 50,
      cancelled: false
    });
    expect(view).to.not.be.instanceof(Order);
    expect(Object.isFrozen(view)).to.equal(true);
    expect(() => {
      view.totalCents = 1;
    }).to.throw(TypeError);
    expect(view.totalCents).to.equal(50);
    expect(view.invoiceNumber).to.equal('—');
    expect(view.paymentMethod).to.equal(null);
  });
});

describe('OrderRangeSummary', () => {
  it('rounds a half cent up', () => {
    const summary = new OrderRangeSummary({totalCents: 201, ticketCount: 2});
    expect(summary.averageCents).to.equal(101);
    expect(summary.totalCents).to.equal(201);
    expect(summary.ticketCount).to.equal(2);
    expect(Object.isFrozen(summary)).to.equal(true);
    expect(() => {
      summary.averageCents = 0;
    }).to.throw(TypeError);
    expect(summary.averageCents).to.equal(101);
  });

  it('is zero when there are no tickets', () => {
    expect(new OrderRangeSummary({totalCents: 0, ticketCount: 0}).averageCents).to.equal(0);
  });

  it('is zero when the count is missing', () => {
    expect(new OrderRangeSummary({totalCents: 10, ticketCount: null}).averageCents).to.equal(0);
  });
});

describe('OrderRepository read methods', () => {
  const port = new OrderRepository();

  it('requires an adapter for findByRange', () => {
    expect(() => port.findByRange({from: 'a', to: 'b'})).to.throw('OrderRepository#findByRange must be implemented');
  });

  it('requires an adapter for summary', () => {
    expect(() => port.summary({from: 'a', to: 'b'})).to.throw('OrderRepository#summary must be implemented');
  });
});
