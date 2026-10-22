import {expect} from 'chai';
import Order from '../../../../openMarket/domain/order/Order';
import OrderDetail from '../../../../openMarket/domain/order/OrderDetail';

describe('OrderDetail', () => {
  it('keeps the stored invoice and does not apply sale rules', () => {
    const detail = new OrderDetail({
      orderId: 'sale-1',
      invoiceNumber: '2026/000042',
      invoiceType: 'F2',
      cancelled: false,
      createdAt: '2026-10-21T10:00:00',
      payment: {method: 'cash', tenderedCents: 2000, changeCents: 687},
      lines: [{
        kind: 'FREE',
        barcode: '',
        name: 'Bolsa',
        unitPriceCents: 50,
        quantityMilli: 0,
        weighted: false,
        amountCents: 50,
        vat: {kind: 'S1', percent: 21, cause: null}
      }],
      vat: [{kind: 'S1', percent: 21, cause: null, baseCents: 41, quotaCents: 9}],
      totalCents: 50
    });
    expect(detail).to.not.be.instanceof(Order);
    expect(Object.isFrozen(detail)).to.equal(true);
    expect(() => {
      detail.totalCents = 1;
    }).to.throw(TypeError);
    expect(detail.orderId).to.equal('sale-1');
    expect(detail.invoiceNumber).to.equal('2026/000042');
    expect(detail.invoiceType).to.equal('F2');
    expect(detail.cancelled).to.equal(false);
    expect(detail.createdAt).to.equal('2026-10-21T10:00:00');
    expect(detail.payment.method).to.equal('cash');
    expect(detail.payment.tenderedCents).to.equal(2000);
    expect(detail.payment.changeCents).to.equal(687);
    expect(detail.lines[0].quantityMilli).to.equal(0);
    expect(detail.lines[0].kind).to.equal('FREE');
    expect(detail.vat[0].quotaCents).to.equal(9);
    expect(detail.totalCents).to.equal(50);
  });

  it('can name a missing invoice and a cancelled sale', () => {
    const detail = new OrderDetail({
      orderId: 'bare',
      invoiceNumber: '—',
      invoiceType: null,
      cancelled: true,
      createdAt: '',
      payment: null,
      lines: [],
      vat: [],
      totalCents: 0
    });
    expect(detail.invoiceNumber).to.equal('—');
    expect(detail.invoiceType).to.equal(null);
    expect(detail.cancelled).to.equal(true);
    expect(detail.payment).to.equal(null);
    expect(detail.lines).to.deep.equal([]);
    expect(detail.totalCents).to.equal(0);
  });
});
