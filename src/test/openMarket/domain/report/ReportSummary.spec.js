import {expect} from 'chai';
import ReportSummary from '../../../../openMarket/domain/report/ReportSummary';

function summary(overrides) {
  return new ReportSummary({
    from: '2026-11-03 00:00:00',
    to: '2026-11-09 23:59:59',
    previousFrom: '2026-10-27 00:00:00',
    previousTo: '2026-11-02 23:59:59',
    salesCents: 200,
    previousSalesCents: 100,
    ticketCount: 4,
    previousTicketCount: 2,
    averageCents: 50,
    previousAverageCents: 50,
    units: 3,
    previousUnits: 6,
    days: [{date: '2026-11-03', cashCents: 200, cardCents: 0, bizumCents: 0, previousTotalCents: 100}],
    mostSold: [{barcode: '1', name: 'Milk', quantity: 2, amountCents: 200}],
    lowStockTotal: 1,
    lowStockItems: [{barcode: '1', name: 'Milk', stock: 0, stockMin: 1, weighted: false}],
    ...overrides
  });
}

describe('ReportSummary', () => {
  it('stores the four comparisons and freezes the lists', () => {
    const view = summary();
    expect(view.salesChange).to.equal(1);
    expect(view.ticketChange).to.equal(1);
    expect(view.averageChange).to.equal(0);
    expect(view.unitsChange).to.equal(-0.5);
    expect(view.days[0].cashCents).to.equal(200);
    expect(view.mostSold[0].name).to.equal('Milk');
    expect(view.lowStock.total).to.equal(1);
    expect(view.lowStock.items[0].weighted).to.equal(false);
    expect(Object.isFrozen(view)).to.equal(true);
    expect(Object.isFrozen(view.days)).to.equal(true);
    expect(Object.isFrozen(view.mostSold[0])).to.equal(true);
    expect(Object.isFrozen(view.lowStock.items[0])).to.equal(true);
  });

  it('has no comparison when the previous value is zero', () => {
    const view = summary({
      previousSalesCents: 0,
      previousTicketCount: 0,
      previousAverageCents: 0,
      previousUnits: 0
    });
    expect(view.salesChange).to.equal(null);
    expect(view.ticketChange).to.equal(null);
    expect(view.averageChange).to.equal(null);
    expect(view.unitsChange).to.equal(null);
  });
});
