import {expect} from 'chai';
import Money from '../../../../../openMarket/domain/money/Money';
import {formatMoney} from '../../../../../openMarket/user_interface/i18n/money';
import {
  clockTime,
  formatKg,
  itemLabel,
  orderMeta,
  orderWhen,
  paymentLabel,
  paymentLine,
  vatLabel,
  weightedPrice
} from '../../../../../openMarket/user_interface/order/list_orders/format';

describe('order list format', () => {
  it('reads the clock time from a shop-local timestamp', () => {
    expect(clockTime('2026-10-21T14:02:03')).to.equal('14:02');
    expect(clockTime('2026-10-21 09:05:00')).to.equal('09:05');
    expect(clockTime(null)).to.equal('');
    expect(clockTime('nope')).to.equal('');
  });

  it('names the payment method', () => {
    expect(paymentLabel('cash')).to.equal('Efectivo');
    expect(paymentLabel('card')).to.equal('Tarjeta');
    expect(paymentLabel(null)).to.equal('');
    expect(paymentLabel('bizum')).to.equal('');
  });

  it('labels the item count', () => {
    expect(itemLabel(1)).to.equal('1 artículo');
    expect(itemLabel(3)).to.equal('3 artículos');
    expect(itemLabel(0)).to.equal('0 artículos');
    expect(itemLabel(Number.NaN)).to.equal('0 artículos');
  });

  it('joins the row meta and skips a missing payment', () => {
    expect(orderMeta({
      createdAt: '2026-10-21T14:02:03',
      itemCount: 3,
      paymentMethod: 'cash'
    })).to.equal('14:02 · 3 artículos · Efectivo');
    expect(orderMeta({createdAt: '2026-10-21T14:02:03', itemCount: 1, paymentMethod: null}))
      .to.equal('14:02 · 1 artículo');
  });

  it('formats the payment line from cents', () => {
    const tendered = formatMoney(Money.ofCents(2000));
    const change = formatMoney(Money.ofCents(687));
    expect(paymentLine({method: 'cash', tenderedCents: 2000, changeCents: 687}))
      .to.equal('Efectivo (entregado ' + tendered + ', cambio ' + change + ')');
    expect(tendered).to.contain('20,00');
    expect(change).to.contain('6,87');
    expect(paymentLine({method: 'card', tenderedCents: null, changeCents: null})).to.equal('Tarjeta');
    expect(paymentLine({method: 'cash', tenderedCents: null, changeCents: 0})).to.equal('Efectivo');
    expect(paymentLine({method: 'cash', tenderedCents: 1.5, changeCents: 0})).to.equal('Efectivo');
    expect(paymentLine(null)).to.equal('');
    expect(paymentLine(undefined)).to.equal('');
    expect(paymentLine({method: 'bizum'})).to.equal('');
  });

  it('formats the detail date, a weighed price, and a VAT label', () => {
    expect(orderWhen('2026-10-21T14:02:03')).to.equal('21/10/2026 14:02');
    expect(orderWhen('2026-10-21 09:05:00')).to.equal('21/10/2026 09:05');
    expect(orderWhen(null)).to.equal('');
    expect(orderWhen('nope')).to.equal('');
    expect(formatKg(350)).to.equal('0,350');
    expect(formatKg(1000)).to.equal('1');
    expect(formatKg(1500)).to.equal('1,500');
    expect(formatKg(null)).to.equal('0');
    expect(weightedPrice({quantityMilli: 350, unitPriceCents: 1850}))
      .to.equal('0,350 kg × ' + formatMoney(Money.ofCents(1850)) + '/kg');
    expect(weightedPrice({quantityMilli: 1000, unitPriceCents: 699}))
      .to.equal('1 kg × ' + formatMoney(Money.ofCents(699)) + '/kg');
    expect(vatLabel({kind: 'S1', percent: 21, cause: null})).to.equal('21 %');
    expect(vatLabel({kind: 'E', percent: 0, cause: 'E1'})).to.equal('Exento E1');
    expect(vatLabel({kind: 'E', percent: 0, cause: null})).to.equal('Exento ');
    expect(vatLabel({kind: 'N', percent: 0, cause: 'N1'})).to.equal('No sujeto N1');
    expect(vatLabel({kind: 'N', percent: 0})).to.equal('No sujeto ');
    expect(vatLabel({kind: 'S1'})).to.equal(' %');
    expect(vatLabel(null)).to.equal('');
  });
});
