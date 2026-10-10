import { expect } from 'chai';
import DomainEventBus from '../../../../openMarket/domain/service/DomainEventBus';
import OrderCreated from '../../../../openMarket/domain/event/OrderCreated';
import ProductWithLowStock from '../../../../openMarket/domain/event/ProductWithLowStock';

class OtherEvent {}

describe('DomainEventBus', () => {
  const lowStock = () => new ProductWithLowStock({
    barcode: '0001',
    name: 'Coca-Cola',
    stock: 4,
    stockMin: 10
  });

  let bus;

  beforeEach(() => {
    bus = new DomainEventBus();
  });

  it('delivers a published event to a subscriber', () => {
    const seen = [];
    bus.events().subscribe(event => seen.push(event));
    const event = lowStock();

    bus.publish(event);

    expect(seen).to.deep.equal([event]);
  });

  it('delivers a published event to every subscriber', () => {
    const first = [];
    const second = [];
    bus.events().subscribe(event => first.push(event));
    bus.events().subscribe(event => second.push(event));
    const event = lowStock();

    bus.publish(event);

    expect(first).to.deep.equal([event]);
    expect(second).to.deep.equal([event]);
  });

  it('does not throw when nobody is listening', () => {
    expect(() => bus.publish(lowStock())).not.to.throw();
  });

  it('stops delivering after unsubscribe', () => {
    const seen = [];
    const subscription = bus.events().subscribe(event => seen.push(event));
    const first = lowStock();
    bus.publish(first);

    subscription.unsubscribe();
    bus.publish(lowStock());

    expect(seen).to.deep.equal([first]);
  });

  it('does not deliver events published before a subscriber arrives', () => {
    bus.publish(lowStock());
    const seen = [];
    bus.events().subscribe(event => seen.push(event));

    expect(seen).to.deep.equal([]);

    const later = lowStock();
    bus.publish(later);
    expect(seen).to.deep.equal([later]);
  });

  it('ofType delivers only the requested event', () => {
    const seen = [];
    bus.ofType(ProductWithLowStock).subscribe(event => seen.push(event));
    const event = lowStock();

    bus.publish(new OtherEvent());
    bus.publish(event);

    expect(seen).to.have.lengthOf(1);
    expect(seen[0]).to.equal(event);
    expect(seen[0]).to.be.instanceof(ProductWithLowStock);
  });

  it('does not let events() publish', () => {
    const seen = [];
    bus.events().subscribe(event => seen.push(event));
    const events = bus.events();

    expect(events.next).to.equal(undefined);
    expect(events.publish).to.not.equal(bus.publish);
    expect(seen).to.deep.equal([]);
  });

  it('runs synchronous handlers before live listeners', () => {
    const order = [];
    bus.subscribeSync('audit', ProductWithLowStock, () => order.push('sync'));
    bus.events().subscribe(() => order.push('live'));

    bus.publish(lowStock());

    expect(order).to.deep.equal(['sync', 'live']);
  });

  it('propagates a synchronous failure and skips later subscribers', () => {
    const seen = [];
    bus.subscribeSync('first', ProductWithLowStock, () => {
      throw new Error('sync failed');
    });
    bus.subscribeSync('second', ProductWithLowStock, () => seen.push('second'));
    bus.subscribeDurable('third', ProductWithLowStock, () => seen.push('third'));
    bus.events().subscribe(() => seen.push('live'));

    expect(() => bus.publish(lowStock())).to.throw('sync failed');
    expect(seen).to.deep.equal([]);
  });

  it('stops a synchronous handler after unsubscribe', () => {
    const seen = [];
    const unsubscribe = bus.subscribeSync('audit', ProductWithLowStock, () => seen.push('sync'));
    unsubscribe();

    bus.publish(lowStock());

    expect(seen).to.deep.equal([]);
  });

  it('still delivers the event when a durable handler throws and nothing is stored', () => {
    const seen = [];
    bus.subscribeDurable('stats', ProductWithLowStock, () => {
      throw new Error('disk');
    });
    bus.events().subscribe(event => seen.push(event));

    expect(() => bus.publish(lowStock())).not.to.throw();
    expect(seen).to.have.lengthOf(1);
  });
});

describe('DomainEventBus with a store', () => {
  function order() {
    return new OrderCreated({
      id: 'sale-1',
      createdAt: '02/07/2017 10:00:00',
      lines: []
    });
  }

  function lowStockEvent() {
    return new ProductWithLowStock({
      barcode: '0001',
      name: 'Coca-Cola',
      stock: 4,
      stockMin: 10
    });
  }

  function joinedStore() {
    const calls = [];
    return {
      calls,
      inTransaction: () => true,
      begin() {
        throw new Error('begin');
      },
      commit() {
        throw new Error('commit');
      },
      rollback() {
        throw new Error('rollback');
      },
      insertEvent() {
        calls.push('event');
      },
      insertPending() {
        calls.push('pending');
      },
      nextFor() {
        return null;
      }
    };
  }

  function ownedStore() {
    let open = false;
    const calls = [];
    return {
      calls,
      inTransaction: () => open,
      begin() {
        open = true;
        calls.push('begin');
      },
      commit() {
        open = false;
        calls.push('commit');
      },
      rollback() {
        open = false;
        calls.push('rollback');
      },
      insertEvent() {
        calls.push('event');
      },
      insertPending() {
        calls.push('pending');
      },
      nextFor() {
        return null;
      }
    };
  }

  it('joins the open transaction and waits to notify live listeners', () => {
    const store = joinedStore();
    const bus = new DomainEventBus({store});
    const seen = [];
    bus.subscribeSync('audit', OrderCreated, () => seen.push('sync'));
    bus.ofType(OrderCreated).subscribe(() => seen.push('live'));

    bus.publish(order());

    expect(store.calls).to.deep.equal(['event', 'pending']);
    expect(seen).to.deep.equal(['sync']);

    bus.transactionCommitted();

    expect(seen).to.deep.equal(['sync', 'live']);
  });

  it('drops live notifications when the open transaction rolls back', () => {
    const store = joinedStore();
    const bus = new DomainEventBus({store});
    const seen = [];
    bus.ofType(OrderCreated).subscribe(() => seen.push('order'));
    bus.ofType(ProductWithLowStock).subscribe(() => seen.push('low'));
    bus.subscribeSync('boom', ProductWithLowStock, () => {
      throw new Error('sync failed');
    });

    bus.publish(order());
    expect(() => bus.publish(lowStockEvent())).to.throw('sync failed');
    bus.transactionRolledBack();
    bus.transactionCommitted();

    expect(seen).to.deep.equal([]);
    expect(store.calls).to.deep.equal(['event', 'pending', 'event']);
  });

  it('rolls its own transaction back when a synchronous handler throws', () => {
    const store = ownedStore();
    const bus = new DomainEventBus({store});
    const seen = [];
    bus.ofType(OrderCreated).subscribe(() => seen.push('live'));
    bus.subscribeSync('boom', OrderCreated, () => {
      throw new Error('sync failed');
    });

    expect(() => bus.publish(order())).to.throw('sync failed');

    expect(store.calls).to.deep.equal(['begin', 'event', 'rollback']);
    expect(seen).to.deep.equal([]);
    expect(store.inTransaction()).to.equal(false);
  });

  it('commits, then notifies live listeners, when it owns the transaction', () => {
    const store = ownedStore();
    const bus = new DomainEventBus({store});
    const seen = [];
    bus.subscribeSync('audit', OrderCreated, () => seen.push('sync'));
    bus.ofType(OrderCreated).subscribe(() => seen.push('live'));

    bus.publish(order());

    expect(store.calls).to.deep.equal(['begin', 'event', 'pending', 'commit']);
    expect(seen).to.deep.equal(['sync', 'live']);
    expect(store.inTransaction()).to.equal(false);
  });
});
