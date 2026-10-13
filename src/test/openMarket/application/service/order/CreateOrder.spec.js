import {expect} from 'chai';
import * as Rx from 'rxjs';
import Order from '../../../../../openMarket/domain/order/Order';
import OrderCreated from '../../../../../openMarket/domain/event/OrderCreated';
import {deliveringDomainEventBus} from '../../../support/domainEventBus';
import CreateOrder from '../../../../../openMarket/application/service/order/CreateOrder';
import RecordProductSales from '../../../../../openMarket/application/service/product/RecordProductSales';

const lines = [{barcode: '0001', name: 'Cola', price: 0.55, quantity: 2}];

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

  beforeEach(() => {
    bus = deliveringDomainEventBus();
    events = [];
    bus.ofType(OrderCreated).subscribe(event => events.push(event));
  });

  function createOrder({onApply, failStock, throwOnApply, onDispatch} = {}) {
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
      productRepository: productRepository({fail: failStock}),
      orderFactory: {
        createWith({lines: orderLines, date}) {
          return new Order({id: 'order-1', lines: orderLines, date: date || '02/07/2017 10:00:00'});
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

  it('publishes one OrderCreated snapshot after the order is saved', (done) => {
    createOrder().createOrder({lines})
      .subscribe(
        order => {
          expect(order.id).to.equal('order-1');
          expect(events).to.have.lengthOf(1);
          expect(events[0]).to.be.instanceof(OrderCreated);
          expect(events[0].id).to.equal('order-1');
          expect(events[0].createdAt).to.equal('02/07/2017 10:00:00');
          expect(events[0].lines).to.deep.equal(lines);
          expect(events[0].lines[0]).to.not.equal(lines[0]);
        },
        error => done(error),
        () => done()
      );
  });

  it('publishes no OrderCreated when stock cannot be updated', (done) => {
    createOrder({failStock: true}).createOrder({lines})
      .subscribe(
        () => done(new Error('should not emit an order')),
        () => {
          expect(events).to.have.lengthOf(0);
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
