import {expect} from 'chai';
import * as Rx from 'rxjs';
import Payment from '../../../../openMarket/domain/payment/Payment';
import suggestedTenders from '../../../../openMarket/domain/payment/suggestedTenders';
import InvalidPaymentError from '../../../../openMarket/domain/payment/InvalidPaymentError';
import ErrorCode from '../../../../openMarket/domain/error/ErrorCode';
import Money from '../../../../openMarket/domain/money/Money';
import Order from '../../../../openMarket/domain/order/Order';
import CreateOrder from '../../../../openMarket/application/service/order/CreateOrder';
import InvoiceNumber from '../../../../openMarket/domain/invoice/InvoiceNumber';
import SystemClock from '../../../../openMarket/infrastructure/service/SystemClock';
import {deliveringDomainEventBus} from '../../support/domainEventBus';

describe('Payment', () => {
  const total = Money.ofCents(1313);

  it('gives cash change as tendered minus the total', () => {
    const payment = Payment.cash({total, tendered: Money.ofCents(2000)});
    expect(payment.method).to.equal('cash');
    expect(payment.tenderedCents).to.equal(2000);
    expect(payment.changeCents).to.equal(687);
  });

  it('rejects cash that does not cover the total', () => {
    expect(() => Payment.cash({total, tendered: Money.ofCents(1000)}))
      .to.throw(InvalidPaymentError)
      .with.property('code', ErrorCode.PAYMENT_INVALID);
  });

  it('charges a card the exact total and no change', () => {
    const payment = Payment.card({total});
    expect(payment.method).to.equal('card');
    expect(payment.tenderedCents).to.equal(1313);
    expect(payment.changeCents).to.equal(0);
  });

  it('rejects a card tender that is not the total', () => {
    expect(() => Payment.card({total, tendered: Money.ofCents(2000)}))
      .to.throw(InvalidPaymentError)
      .with.property('code', ErrorCode.PAYMENT_INVALID);
  });

  it('rejects an unknown method', () => {
    expect(() => Payment.settle({total, method: 'bizum', tendered: total}))
      .to.throw(InvalidPaymentError);
  });

  it('restores a stored cash payment and ignores a missing one', () => {
    const payment = Payment.restore({method: 'cash', tenderedCents: 2000, changeCents: 687});
    expect(payment.changeCents).to.equal(687);
    expect(Payment.restore({method: null, tenderedCents: null, changeCents: null})).to.equal(null);
    expect(() => Payment.restore({method: 'cash', tenderedCents: 100, changeCents: 250}))
      .to.throw(InvalidPaymentError);
  });
});

describe('suggestedTenders', () => {
  it('offers the exact total and the next 5, 10, 20 and 50 euro notes', () => {
    expect(suggestedTenders(Money.ofCents(1313)).map(amount => amount.cents))
      .to.deep.equal([1313, 1500, 2000, 5000]);
  });

  it('does not repeat a note that is already the exact total', () => {
    expect(suggestedTenders(Money.ofCents(2000)).map(amount => amount.cents))
      .to.deep.equal([2000, 5000]);
  });

  it('offers only the exact amount when the total is zero', () => {
    expect(suggestedTenders(Money.ofCents(0)).map(amount => amount.cents)).to.deep.equal([0]);
  });
});

describe('payment change parity', () => {
  it('keeps the sheet change equal to the change CreateOrder stores', done => {
    const total = Money.ofCents(1313);
    const tendered = Money.ofCents(2000);
    const sheet = Payment.settle({total, method: 'cash', tendered});
    const bus = deliveringDomainEventBus();
    const clock = new SystemClock();
    const at = '2026-10-18T10:00:00.000Z';
    const useCase = new CreateOrder({
      orderRepository: {save: ({order}) => Rx.Observable.of(order)},
      productRepository: {
        findByBarcode: () => Rx.Observable.of({
          subtractStock() { return this; },
          isStockLow() { return false; },
          vatRate: null
        }),
        save: product => Rx.Observable.of(product)
      },
      invoiceRepository: {save: ({invoice}) => Rx.Observable.of(invoice)},
      invoiceSequence: {
        next: ({series}) => Rx.Observable.of(new InvoiceNumber({series, number: 1}))
      },
      orderFactory: {
        createWith() {
          return Order.draft({id: 'order-1', date: '18/10/2026 12:00:00'});
        }
      },
      identity: {generate: () => 'invoice-1'},
      clock: {
        now: () => at,
        localDate({instant}) { return clock.localDate({instant}); },
        zonedNow() { return clock.zoned({instant: at}); },
        zoned({instant}) { return clock.zoned({instant}); }
      },
      domainEventBus: bus,
      transaction: {
        run(work) {
          return work().toArray().flatMap(values => Rx.Observable.from(values));
        }
      },
      domainEventDispatcher: {dispatch() {}}
    });
    useCase.createOrder({
      lines: [{barcode: '0001', name: 'Ham', price: Money.ofCents(1313), quantity: 1}],
      payment: {method: 'cash', tenderedCents: tendered.cents}
    }).subscribe(
      order => {
        expect(order.payment.changeCents).to.equal(sheet.changeCents);
        expect(order.payment.changeCents).to.equal(687);
        done();
      },
      error => done(error)
    );
  });
});
