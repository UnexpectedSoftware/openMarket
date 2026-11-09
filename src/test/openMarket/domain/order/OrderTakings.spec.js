import {expect} from 'chai';
import OrderTakings from '../../../../openMarket/domain/order/OrderTakings';

describe('OrderTakings', () => {
  it('splits cash, card, bizum, and a mixed ticket, and sums every line', () => {
    const takings = OrderTakings.fromRows({
      orders: [
        {soldOn: '2026-11-04', totalCents: 300, method: 'cash'},
        {soldOn: '2026-11-04', totalCents: 200, method: 'card'},
        {soldOn: '2026-11-05', totalCents: 50, method: 'bizum'},
        {
          soldOn: '2026-11-05',
          totalCents: 250,
          method: 'mixed',
          parts: [
            {method: 'cash', amountCents: 100},
            {method: 'card', amountCents: 150}
          ]
        },
        {soldOn: '2026-11-05', totalCents: 50, method: null}
      ],
      lines: [
        {quantityMilli: 1000},
        {quantityMilli: 2000},
        {quantity: 0.5}
      ]
    });

    expect(takings.totalCents).to.equal(850);
    expect(takings.ticketCount).to.equal(5);
    expect(takings.averageCents).to.equal(170);
    expect(takings.units).to.equal(3.5);
    expect(takings.days).to.deep.equal([
      {soldOn: '2026-11-04', cashCents: 300, cardCents: 200, bizumCents: 0},
      {soldOn: '2026-11-05', cashCents: 150, cardCents: 150, bizumCents: 50}
    ]);
    expect(Object.isFrozen(takings)).to.equal(true);
    expect(Object.isFrozen(takings.days[0])).to.equal(true);
  });

  it('counts two lines once toward the money and both toward the units', () => {
    const takings = OrderTakings.fromRows({
      orders: [{soldOn: '2026-11-04', totalCents: 300, method: 'cash'}],
      lines: [{quantityMilli: 1000}, {quantityMilli: 2000}]
    });

    expect(takings.totalCents).to.equal(300);
    expect(takings.ticketCount).to.equal(1);
    expect(takings.units).to.equal(3);
    expect(takings.days[0].cashCents).to.equal(300);
  });

  it('counts an unknown part method as cash and ignores a broken milli quantity', () => {
    const takings = OrderTakings.fromRows({
      orders: [{
        soldOn: '2026-11-04',
        totalCents: 80,
        method: 'mixed',
        parts: [
          {method: 'bizum', amountCents: 30},
          {method: 'voucher', amountCents: 50}
        ]
      }],
      lines: [{quantityMilli: 1.5, quantity: 4}]
    });

    expect(takings.days[0]).to.deep.equal({
      soldOn: '2026-11-04', cashCents: 50, cardCents: 0, bizumCents: 30
    });
    expect(takings.units).to.equal(4);
  });

  it('is empty when the range has no tickets', () => {
    const takings = OrderTakings.fromRows({});
    expect(takings.totalCents).to.equal(0);
    expect(takings.ticketCount).to.equal(0);
    expect(takings.averageCents).to.equal(0);
    expect(takings.units).to.equal(0);
    expect(takings.days).to.deep.equal([]);
  });
});
