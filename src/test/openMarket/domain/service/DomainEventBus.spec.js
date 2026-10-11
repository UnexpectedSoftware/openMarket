import { expect } from 'chai';
import DomainEventBus from '../../../../openMarket/domain/service/DomainEventBus';
import OrderCreated from '../../../../openMarket/domain/event/OrderCreated';
import ProductWithLowStock from '../../../../openMarket/domain/event/ProductWithLowStock';

const FIXED_TIME = '2026-10-11T12:00:00.000Z';

function fixedClock(instant = FIXED_TIME) {
  return {now: () => instant};
}

function sequenceIdentity() {
  let sequence = 0;
  return {
    generate() {
      sequence += 1;
      return 'event-' + sequence;
    }
  };
}

function steppingClock(times) {
  let index = 0;
  return {
    now() {
      const value = times[Math.min(index, times.length - 1)];
      index += 1;
      return value;
    }
  };
}

function memoryRepository() {
  const events = [];
  const processing = [];
  const processingWrites = [];
  return {
    events,
    processing,
    processingWrites,
    save(event) {
      events.push({...event});
    },
    saveProcessing(row) {
      const stored = {...row};
      processingWrites.push(stored);
      const index = processing.findIndex(item =>
        item.eventId === stored.eventId && item.subscriberName === stored.subscriberName);
      if (index === -1) {
        processing.push({...stored});
        return;
      }
      processing[index] = {...stored};
    },
    findProcessingByStatus({status}) {
      return processing.filter(row => row.status === status).map(row => ({...row}));
    },
    findFirstProcessing({subscriberName, statuses}) {
      const row = processing.find(item =>
        item.subscriberName === subscriberName && statuses.includes(item.status));
      if (!row) {
        return null;
      }
      const event = events.find(item => item.id === row.eventId);
      return {
        eventId: row.eventId,
        subscriberName: row.subscriberName,
        type: event.type,
        payload: event.payload,
        status: row.status,
        attempts: row.attempts,
        lastError: row.lastError
      };
    }
  };
}

function recordingTransaction({joined}) {
  let open = joined;
  const calls = [];
  return {
    calls,
    inTransaction() {
      return open;
    },
    execute(work) {
      if (open) {
        calls.push('join');
        return work();
      }
      open = true;
      calls.push('begin');
      try {
        const result = work();
        open = false;
        calls.push('commit');
        return result;
      } catch (error) {
        open = false;
        calls.push('rollback');
        throw error;
      }
    }
  };
}

function openBus({
  joined = false,
  clock = fixedClock(),
  identity = sequenceIdentity(),
  repository = memoryRepository()
} = {}) {
  const transaction = recordingTransaction({joined});
  const bus = new DomainEventBus({
    repository,
    transaction,
    identity,
    clock,
    intervalMs: 60000
  });
  return {bus, transaction, repository, clock};
}

describe('DomainEventBus', () => {
  const lowStock = () => new ProductWithLowStock({
    barcode: '0001',
    name: 'Coca-Cola',
    stock: 4,
    stockMin: 10
  });

  let bus;
  let repository;

  beforeEach(() => {
    const opened = openBus();
    bus = opened.bus;
    repository = opened.repository;
  });

  afterEach(() => {
    bus.stop();
  });

  it('requires a repository, a transaction, an identity, and a clock', () => {
    expect(() => new DomainEventBus()).to.throw(
      'DomainEventBus requires a repository, a transaction, an identity, and a clock'
    );
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

    bus.publish(new OrderCreated({id: 'sale-1', createdAt: '02/07/2017 10:00:00', lines: []}));
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
    expect(repository.processing).to.deep.equal([]);
  });

  it('stops a synchronous handler after unsubscribe', () => {
    const seen = [];
    const unsubscribe = bus.subscribeSync('audit', ProductWithLowStock, () => seen.push('sync'));
    unsubscribe();

    bus.publish(lowStock());

    expect(seen).to.deep.equal([]);
  });

  it('still delivers the event when a durable handler throws', () => {
    const seen = [];
    bus.subscribeDurable('stats', ProductWithLowStock, () => {
      throw new Error('disk');
    });
    bus.events().subscribe(event => seen.push(event));

    expect(() => bus.publish(lowStock())).not.to.throw();
    expect(seen).to.have.lengthOf(1);
    expect(repository.processing).to.deep.equal([{
      eventId: 'event-1',
      subscriberName: 'stats',
      status: 'FAILED',
      attempts: 1,
      lastError: 'disk',
      updatedAt: FIXED_TIME
    }]);
  });

  it('stamps the event and each processing write with the clock', () => {
    const clock = steppingClock([
      '2026-10-11T12:00:00.000Z',
      '2026-10-11T12:00:01.000Z',
      '2026-10-11T12:00:02.000Z'
    ]);
    const opened = openBus({
      clock,
      identity: {generate: () => 'event-9'}
    });
    opened.bus.subscribeDurable('plugin', OrderCreated, () => {});

    opened.bus.publish(new OrderCreated({
      id: 'sale-1',
      createdAt: '02/07/2017 10:00:00',
      lines: []
    }));
    opened.bus.stop();

    expect(opened.repository.events[0].createdAt).to.equal('2026-10-11T12:00:00.000Z');
    expect(opened.repository.processingWrites.map(row => [row.status, row.updatedAt])).to.deep.equal([
      ['PENDING', '2026-10-11T12:00:00.000Z'],
      ['PROCESSING', '2026-10-11T12:00:01.000Z'],
      ['DONE', '2026-10-11T12:00:02.000Z']
    ]);
  });
});

describe('DomainEventBus with a repository', () => {
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

  function busWith({joined}) {
    return openBus({
      joined,
      identity: {generate: () => 'event-1'}
    });
  }

  it('joins the open transaction and waits to notify live listeners', () => {
    const {bus, transaction, repository} = busWith({joined: true});
    const seen = [];
    bus.subscribeSync('audit', OrderCreated, () => seen.push('sync'));
    bus.ofType(OrderCreated).subscribe(() => seen.push('live'));

    bus.publish(order());

    expect(transaction.calls).to.deep.equal(['join']);
    expect(repository.events).to.have.lengthOf(1);
    expect(repository.events[0].id).to.equal('event-1');
    expect(repository.events[0].createdAt).to.equal(FIXED_TIME);
    expect(repository.processing).to.have.lengthOf(0);
    expect(seen).to.deep.equal(['sync']);

    bus.transactionCommitted();

    expect(seen).to.deep.equal(['sync', 'live']);
    bus.stop();
  });

  it('drops live notifications when the open transaction rolls back', () => {
    const {bus, transaction, repository} = busWith({joined: true});
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
    expect(transaction.calls).to.deep.equal(['join', 'join']);
    expect(repository.events).to.have.lengthOf(2);
    expect(repository.processing).to.have.lengthOf(0);
    bus.stop();
  });

  it('rolls its own transaction back when a synchronous handler throws', () => {
    const {bus, transaction, repository} = busWith({joined: false});
    const seen = [];
    bus.ofType(OrderCreated).subscribe(() => seen.push('live'));
    bus.subscribeSync('boom', OrderCreated, () => {
      throw new Error('sync failed');
    });

    expect(() => bus.publish(order())).to.throw('sync failed');

    expect(transaction.calls).to.deep.equal(['begin', 'rollback']);
    expect(repository.events).to.have.lengthOf(1);
    expect(repository.events[0].id).to.equal('event-1');
    expect(repository.processing).to.have.lengthOf(0);
    expect(seen).to.deep.equal([]);
    expect(transaction.inTransaction()).to.equal(false);
    bus.stop();
  });

  it('commits, then notifies live listeners, when it owns the transaction', () => {
    const {bus, transaction, repository} = busWith({joined: false});
    const seen = [];
    bus.subscribeSync('audit', OrderCreated, () => seen.push('sync'));
    bus.ofType(OrderCreated).subscribe(() => seen.push('live'));

    bus.publish(order());

    expect(transaction.calls).to.deep.equal(['begin', 'commit']);
    expect(repository.events).to.have.lengthOf(1);
    expect(repository.events[0].id).to.equal('event-1');
    expect(repository.events[0].createdAt).to.equal(FIXED_TIME);
    expect(repository.processing).to.have.lengthOf(0);
    expect(seen).to.deep.equal(['sync', 'live']);
    expect(transaction.inTransaction()).to.equal(false);
    bus.stop();
  });
});
