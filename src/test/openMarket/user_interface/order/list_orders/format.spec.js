import {expect} from 'chai';
import {clockTime, itemLabel, orderMeta, paymentLabel} from '../../../../../openMarket/user_interface/order/list_orders/format';

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
});
