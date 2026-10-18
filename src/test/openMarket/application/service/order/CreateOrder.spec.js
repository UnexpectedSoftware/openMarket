import {expect} from 'chai';
import * as Rx from 'rxjs';
import Order from '../../../../../openMarket/domain/order/Order';
import OrderCreated from '../../../../../openMarket/domain/event/OrderCreated';
import InvoiceIssued from '../../../../../openMarket/domain/event/InvoiceIssued';
import InvoiceNumber from '../../../../../openMarket/domain/invoice/InvoiceNumber';
import {deliveringDomainEventBus} from '../../../support/domainEventBus';
import CreateOrder from '../../../../../openMarket/application/service/order/CreateOrder';
import RecordProductSales from '../../../../../openMarket/application/service/product/RecordProductSales';
import SystemClock from '../../../../../openMarket/infrastructure/service/SystemClock';
import ShopProfile from '../../../../../openMarket/domain/shop/ShopProfile';
import TaxId from '../../../../../openMarket/domain/shop/TaxId';
import InvoiceType from '../../../../../openMarket/domain/invoice/InvoiceType';
import ErrorCode from '../../../../../openMarket/domain/error/ErrorCode';
import Money from '../../../../../openMarket/domain/money/Money';
import VatRate from '../../../../../openMarket/domain/tax/VatRate';

const lines = [{barcode: '0001', name: 'Cola', price: 0.55, quantity: 2}];
const issuedAt = '2026-10-14T12:00:00.000Z';

function productRepository({fail} = {}) {
  const product = {
    subtractStock() {
      return this;
    },
    isStockLow() {
      return false;
    }
  };
  return {
    findByBarcode() {
      return fail ? Rx.Observable.throw(new Error('missing')) : Rx.Observable.of(product);
    },
    save() {
      return Rx.Observable.of(product);
    }
  };
}

describe('CreateOrder domain events', () => {
  let bus;
  let events;
  let invoices;
  let storedInvoices;
  let sequenceCalls;

  beforeEach(() => {
    bus = deliveringDomainEventBus();
    events = [];
    invoices = [];
    storedInvoices = [];
    sequenceCalls = [];
    bus.ofType(OrderCreated).subscribe(event => events.push(event));
    bus.ofType(InvoiceIssued).subscribe(event => invoices.push(event));
  });

  function createOrder({onApply, failStock, throwOnApply, onDispatch, issuedAt: at = issuedAt, shopProfileRepository, repository} = {}) {
    const clock = new SystemClock();
    let allocated = 0;
    const recorder = new RecordProductSales({
      repository: {
        isEmpty: () => false,
        applyOrder(order) {
          if (throwOnApply) {
            throw new Error('disk');
          }
          if (onApply) {
            onApply(order);
          }
        }
      },
      domainEventBus: bus
    });
    recorder.start();
    return new CreateOrder({
      orderRepository: {
        save({order}) {
          return Rx.Observable.of(order);
        }
      },
      productRepository: repository || productRepository({fail: failStock}),
      invoiceRepository: {
        save({invoice}) {
          storedInvoices.push(invoice);
          return Rx.Observable.of(invoice);
        }
      },
      shopProfileRepository,
      invoiceSequence: {
        next({series}) {
          sequenceCalls.push(series);
          allocated += 1;
          return Rx.Observable.of(new InvoiceNumber({series, number: allocated}));
        }
      },
      orderFactory: {
        createWith({lines: orderLines, date}) {
          return new Order({id: 'order-1', lines: orderLines, date: date || '02/07/2017 10:00:00'});
        }
      },
      identity: {generate: () => 'invoice-1'},
      clock: {
        now: () => at,
        localDate({instant}) {
          return clock.localDate({instant});
        },
        zonedNow() {
          return clock.zoned({instant: at});
        },
        zoned({instant}) {
          return clock.zoned({instant});
        }
      },
      domainEventBus: bus,
      transaction: {
        run(work) {
          return work().toArray().flatMap(values => Rx.Observable.from(values));
        }
      },
      domainEventDispatcher: {
        dispatch() {
          if (onDispatch) {
            onDispatch();
          }
          bus.fanOut();
          bus.deliverReady();
        }
      }
    });
  }

  it('uses the Madrid year when UTC is still the previous year', (done) => {
    createOrder({issuedAt: '2026-12-31T23:30:00.000Z'}).createOrder({lines})
      .subscribe(
        () => {
          expect(sequenceCalls).to.deep.equal(['2027']);
          expect(invoices).to.have.lengthOf(1);
          expect(invoices[0].series).to.equal('2027');
          expect(invoices[0].invoiceNumber).to.equal('2027/000001');
          expect(invoices[0].issuedAt).to.equal('2027-01-01T00:30:00+01:00');
          expect(storedInvoices[0].issueDate).to.equal('2027-01-01');
        },
        error => done(error),
        () => done()
      );
  });

  it('publishes one OrderCreated snapshot after the order is saved', (done) => {
    createOrder().createOrder({lines})
      .subscribe(
        order => {
          expect(order.id).to.equal('order-1');
          expect(events).to.have.lengthOf(1);
          expect(events[0]).to.be.instanceof(OrderCreated);
          expect(events[0].id).to.equal('order-1');
          expect(events[0].createdAt).to.equal('02/07/2017 10:00:00');
          expect(events[0].lines).to.deep.equal([{
            barcode: '0001',
            name: 'Cola',
            price: 0.55,
            quantity: 2,
            amount: 1.1,
            priceCents: 55,
            quantityMilli: 2000,
            amountCents: 110
          }]);
          expect(events[0].lines[0]).to.not.equal(lines[0]);
          expect(sequenceCalls).to.deep.equal(['2026']);
          expect(invoices).to.have.lengthOf(1);
          expect(invoices[0]).to.be.instanceof(InvoiceIssued);
          expect(invoices[0].schemaVersion).to.equal(1);
          expect(invoices[0].invoiceId).to.equal('invoice-1');
          expect(invoices[0].invoiceNumber).to.equal('2026/000001');
          expect(invoices[0].orderId).to.equal('order-1');
          expect(invoices[0].issuedAt).to.equal(new SystemClock().zoned({instant: issuedAt}).local);
          expect(invoices[0].issueDate).to.equal('2026-10-14');
          expect(invoices[0].type).to.equal('F2');
          expect(invoices[0].totalCents).to.equal(110);
          expect(invoices[0].vatTotalCents).to.equal(19);
          expect(invoices[0].issuer).to.equal(null);
          expect(invoices[0].lines).to.deep.equal([{
            position: 0,
            barcode: '0001',
            name: 'Cola',
            unitPriceCents: 55,
            quantityMilli: 2000,
            amountCents: 110,
            vat: {kind: 'S1', percent: 21, cause: null}
          }]);
        },
        error => done(error),
        () => done()
      );
  });

  it('returns the order when a listener throws and keeps that listener', (done) => {
    let thrown = 0;
    bus.ofType(OrderCreated).subscribe(() => {
      thrown += 1;
      throw new Error('toast failed');
    });
    const useCase = createOrder();
    useCase.createOrder({lines}).subscribe(
      order => {
        expect(order.id).to.equal('order-1');
        expect(events).to.have.lengthOf(1);
        expect(thrown).to.equal(1);
      },
      error => done(error),
      () => {
        useCase.createOrder({lines}).subscribe(
          () => {
            expect(events).to.have.lengthOf(2);
            expect(thrown).to.equal(2);
          },
          error => done(error),
          () => done()
        );
      }
    );
  });

  it('publishes no OrderCreated when stock cannot be updated', (done) => {
    createOrder({failStock: true}).createOrder({lines})
      .subscribe(
        () => done(new Error('should not emit an order')),
        () => {
          expect(events).to.have.lengthOf(0);
          expect(invoices).to.have.lengthOf(0);
          expect(sequenceCalls).to.have.lengthOf(0);
          done();
        }
      );
  });

  it('still saves the order when the statistics subscriber fails', (done) => {
    createOrder({throwOnApply: true}).createOrder({lines})
      .subscribe(
        order => {
          expect(order.id).to.equal('order-1');
        },
        error => done(error),
        () => done()
      );
  });

  it('dispatches durable handlers after the sale and not when the sale fails', (done) => {
    let dispatched = 0;
    createOrder({
      failStock: true,
      onDispatch() {
        dispatched += 1;
      }
    }).createOrder({lines})
      .subscribe(
        () => done(new Error('should not emit an order')),
        () => {
          expect(dispatched).to.equal(0);
          expect(events).to.have.lengthOf(0);
          createOrder({
            onDispatch() {
              dispatched += 1;
            }
          }).createOrder({lines})
            .subscribe(
              () => {
                expect(dispatched).to.equal(1);
                expect(events).to.have.lengthOf(1);
              },
              error => done(error),
              () => done()
            );
        }
      );
  });

  it('copies the shop onto the invoice and leaves that copy alone', (done) => {
    let current = new ShopProfile({
      nif: TaxId.parse('B12345674'),
      legalName: 'Ultramarinos Pérez SL',
      tradeName: 'Ultramarinos Pérez',
      address: {street: 'Mayor 1', postalCode: '28001', city: 'Madrid', province: 'Madrid', country: 'ES'},
      invoicingEnabled: true
    });
    createOrder({
      shopProfileRepository: {find: () => Rx.Observable.of(current)}
    }).createOrder({lines}).subscribe(
      () => {
        const invoice = storedInvoices[0];
        expect(invoice.type).to.equal(InvoiceType.F2);
        expect(invoice.issueDate).to.equal('2026-10-14');
        expect(invoice.issuedAt).to.equal('2026-10-14T14:00:00+02:00');
        expect(invoice.issuer).to.deep.equal({
          nif: 'B12345674',
          legalName: 'Ultramarinos Pérez SL',
          tradeName: 'Ultramarinos Pérez',
          address: {street: 'Mayor 1', postalCode: '28001', city: 'Madrid', province: 'Madrid', country: 'ES'}
        });
        current = new ShopProfile({
          nif: TaxId.parse('12345678Z'),
          legalName: 'Other Shop',
          invoicingEnabled: true
        });
        expect(storedInvoices[0].issuer.legalName).to.equal('Ultramarinos Pérez SL');
        expect(storedInvoices[0].issuer.nif).to.equal('B12345674');
      },
      error => done(error),
      () => done()
    );
  });

  it('refuses the sale when invoicing is on and the shop has no NIF', (done) => {
    createOrder({
      shopProfileRepository: {
        find: () => Rx.Observable.of(new ShopProfile({
          nif: null,
          legalName: '',
          invoicingEnabled: true
        }))
      }
    }).createOrder({lines}).subscribe(
      () => done(new Error('the sale was stored')),
      error => {
        expect(error.code).to.equal(ErrorCode.SHOP_PROFILE_INCOMPLETE);
        expect(storedInvoices).to.have.lengthOf(0);
        done();
      }
    );
  });

  it('sells a free-amount line without touching stock', (done) => {
    const subtracted = [];
    const repository = {
      findByBarcode() {
        return Rx.Observable.of({
          vatRate: VatRate.of({kind: 'S1', percent: 21}),
          isWeighted: false,
          subtractStock({quantity}) {
            subtracted.push(quantity);
            return this;
          },
          isStockLow() {
            return false;
          }
        });
      },
      save({product}) {
        return Rx.Observable.of(product);
      }
    };
    createOrder({repository}).createOrder({
      lines: [
        {kind: 'PRODUCT', barcode: '0001', name: 'Cola', price: 1.1, quantity: 1},
        {kind: 'FREE', name: 'Venta libre', price: Money.from('3.50'), vatRate: VatRate.of({kind: 'S1', percent: 10})}
      ]
    }).subscribe(
      order => {
        expect(subtracted).to.deep.equal([1]);
        expect(order.total.cents).to.equal(460);
        expect(order.lines.map(line => line.kind)).to.deep.equal(['PRODUCT', 'FREE']);
        expect(order.lines[1].barcode).to.equal('');
        expect(order.lines[1].amount.cents).to.equal(350);
        expect(invoices[0].lines.map(line => line.vat)).to.deep.equal([
          {kind: 'S1', percent: 21, cause: null},
          {kind: 'S1', percent: 10, cause: null}
        ]);
        expect(invoices[0].lines[0]).to.not.have.property('kind');
        expect(invoices[0].totalCents).to.equal(460);
        expect(invoices[0].vatBreakdown.map(row => row.percent)).to.deep.equal([21, 10]);
      },
      error => done(error),
      () => done()
    );
  });

  it('stores cash change and does not put the payment on the invoice', (done) => {
    createOrder().createOrder({
      lines,
      payment: {method: 'cash', tenderedCents: 200}
    }).subscribe(
      order => {
        expect(order.payment.method).to.equal('cash');
        expect(order.payment.tenderedCents).to.equal(200);
        expect(order.payment.changeCents).to.equal(200 - order.total.cents);
        expect(order.payment.changeCents).to.be.above(0);
        expect(invoices[0].schemaVersion).to.equal(1);
        expect(invoices[0]).to.not.have.property('payment');
        expect(invoices[0]).to.not.have.property('tenderedCents');
      },
      error => done(error),
      () => done()
    );
  });

  it('stores a card payment for the exact total', (done) => {
    createOrder().createOrder({
      lines,
      payment: {method: 'card'}
    }).subscribe(
      order => {
        expect(order.payment.method).to.equal('card');
        expect(order.payment.tenderedCents).to.equal(order.total.cents);
        expect(order.payment.changeCents).to.equal(0);
        expect(invoices[0]).to.not.have.property('payment');
      },
      error => done(error),
      () => done()
    );
  });

  it('rejects cash that does not cover the total', (done) => {
    createOrder().createOrder({
      lines,
      payment: {method: 'cash', tenderedCents: 1}
    }).subscribe(
      () => done(new Error('should fail')),
      error => {
        expect(error.code).to.equal(ErrorCode.PAYMENT_INVALID);
        expect(events).to.have.lengthOf(0);
        expect(invoices).to.have.lengthOf(0);
        expect(storedInvoices).to.have.lengthOf(0);
        done();
      }
    );
  });
});

describe('RecordProductSales', () => {
  it('rebuilds an empty table once, then keeps listening', () => {
    const bus = deliveringDomainEventBus();
    let rebuilt = 0;
    let applied = 0;
    const recorder = new RecordProductSales({
      repository: {
        isEmpty: () => true,
        rebuildFromOrders() {
          rebuilt += 1;
        },
        applyOrder() {
          applied += 1;
        }
      },
      domainEventBus: bus
    });
    recorder.start();
    recorder.start();
    const event = new OrderCreated({
      id: '1',
      createdAt: '02/07/2017 10:00:00',
      lines
    });
    bus.save(event);
    bus.raise();
    expect(applied).to.equal(0);
    bus.fanOut();
    bus.deliverReady();
    expect(rebuilt).to.equal(1);
    expect(applied).to.equal(1);
    bus.deliverReady();
    expect(applied).to.equal(1);
  });

  it('subscribes even when the backfill fails', () => {
    const bus = deliveringDomainEventBus();
    let applied = false;
    const errorLog = console.error;
    console.error = () => {};
    try {
      const recorder = new RecordProductSales({
        repository: {
          isEmpty: () => true,
          rebuildFromOrders() {
            throw new Error('backfill');
          },
          applyOrder() {
            applied = true;
          }
        },
        domainEventBus: bus
      });
      recorder.start();
      const event = new OrderCreated({
        id: '1',
        createdAt: '02/07/2017 10:00:00',
        lines
      });
      bus.save(event);
      bus.fanOut();
      bus.deliverReady();
    } finally {
      console.error = errorLog;
    }
    expect(applied).to.equal(true);
  });
});
