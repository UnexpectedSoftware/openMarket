import {expect} from 'chai';
import Money from '../../../../openMarket/domain/money/Money';
import VatRate from '../../../../openMarket/domain/tax/VatRate';
import VatBreakdown from '../../../../openMarket/domain/tax/VatBreakdown';

function line(cents, percent) {
  return {amount: Money.ofCents(cents), vatRate: VatRate.of({percent})};
}

describe('VatBreakdown', () => {
  it('splits a known basket so base and quota add up to the total', () => {
    const rows = VatBreakdown.fromLines([
      line(1210, 21),
      line(110, 10),
      line(99, 4)
    ]);

    expect(rows.map(row => ({
      percent: row.rate.percent,
      base: row.base.cents,
      quota: row.quota.cents,
      gross: row.gross.cents
    }))).to.deep.equal([
      {percent: 21, base: 1000, quota: 210, gross: 1210},
      {percent: 10, base: 100, quota: 10, gross: 110},
      {percent: 4, base: 95, quota: 4, gross: 99}
    ]);
    const gross = rows.reduce((sum, row) => sum + row.gross.cents, 0);
    const parts = rows.reduce((sum, row) => sum + row.base.cents + row.quota.cents, 0);
    expect(parts).to.equal(gross);
  });

  it('groups several lines of one rate before rounding', () => {
    const rows = VatBreakdown.fromLines([
      line(50, 21),
      line(50, 21)
    ]);
    expect(rows).to.have.lengthOf(1);
    expect(rows[0].gross.cents).to.equal(100);
    expect(rows[0].base.cents + rows[0].quota.cents).to.equal(100);
  });
});
