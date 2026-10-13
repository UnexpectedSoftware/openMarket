import { expect } from 'chai';
import DomainEventBus from '../../../../openMarket/domain/service/DomainEventBus';
import OrderCreated from '../../../../openMarket/domain/event/OrderCreated';
import ProductWithLowStock from '../../../../openMarket/domain/event/ProductWithLowStock';
import {memoryDomainEventRepository} from '../../support/domainEventBus';

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

function openBus({
  clock = fixedClock(),
  identity = sequenceIdentity(),
  repository = memoryDomainEventRepository()
} = {}) {
  const bus = new DomainEventBus({repository, identity, clock});
  return {bus, repository, clock};
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

  it('requires a repository, an identity, and a clock', () => {
    expect(() => new DomainEventBus()).to.throw(
      'DomainEventBus requires a repository, an identity, and a clock'
    );
  });

  it('saves an event without notifying listeners', () => {
    const seen = [];
    bus.events().subscribe(event => seen.push(event));

    bus.save(lowStock());

    expect(seen).to.deep.equal([]);
    expect(repository.events).to.have.lengthOf(1);
    expect(repository.events[0].id).to.equal('event-1');
    expect(repository.events[0].createdAt).to.equal(FIXED_TIME);
    expect(repository.events[0].dispatchedAt).to.equal(null);
    expect(repository.processing).to.deep.equal([]);
  });

  it('raises a saved event to every live listener', () => {
    const first = [];
    const second = [];
    bus.events().subscribe(event => first.push(event));
    bus.events().subscribe(event => second.push(event));
    const event = lowStock();

    bus.save(event);
    bus.raise();

    expect(first).to.deep.equal([event]);
    expect(second).to.deep.equal([event]);
  });

  it('raises every event saved since the last raise', () => {
    const seen = [];
    bus.events().subscribe(event => seen.push(event));
    const first = lowStock();
    const second = lowStock();
    bus.save(first);
    bus.save(second);

    bus.raise();

    expect(seen).to.deep.equal([first, second]);
    bus.raise();
    expect(seen).to.deep.equal([first, second]);
  });

  it('drops a saved event on discard so a later raise cannot announce it', () => {
    const seen = [];
    bus.events().subscribe(event => seen.push(event));
    bus.save(lowStock());
    bus.discard();
    bus.raise();

    expect(seen).to.deep.equal([]);
    expect(repository.events).to.have.lengthOf(1);
  });

  it('does not throw when nobody is listening', () => {
    const event = lowStock();
    expect(() => {
      bus.save(event);
      bus.raise();
    }).not.to.throw();
  });

  it('stops delivering after unsubscribe', () => {
    const seen = [];
    const subscription = bus.events().subscribe(event => seen.push(event));
    const first = lowStock();
    bus.save(first);
    bus.raise();

    subscription.unsubscribe();
    bus.save(lowStock());
    bus.raise();

    expect(seen).to.deep.equal([first]);
  });

  it('does not deliver events raised before a subscriber arrives', () => {
    bus.save(lowStock());
    bus.raise();
    const seen = [];
    bus.events().subscribe(event => seen.push(event));

    expect(seen).to.deep.equal([]);

    const later = lowStock();
    bus.save(later);
    bus.raise();
    expect(seen).to.deep.equal([later]);
  });

  it('ofType delivers only the requested event', () => {
    const seen = [];
    bus.ofType(ProductWithLowStock).subscribe(event => seen.push(event));
    const event = lowStock();

    bus.save(new OrderCreated({id: 'sale-1', createdAt: '02/07/2017 10:00:00', lines: []}));
    bus.save(event);
    bus.raise();

    expect(seen).to.have.lengthOf(1);
    expect(seen[0]).to.equal(event);
    expect(seen[0]).to.be.instanceof(ProductWithLowStock);
  });

  it('does not let events() raise', () => {
    const seen = [];
    bus.events().subscribe(event => seen.push(event));
    const events = bus.events();

    expect(events.next).to.equal(undefined);
    expect(events.raise).to.equal(undefined);
    expect(seen).to.deep.equal([]);
  });

  it('runs synchronous handlers before live listeners', () => {
    const order = [];
    bus.subscribeSync('audit', ProductWithLowStock, () => order.push('sync'));
    bus.events().subscribe(() => order.push('live'));

    bus.save(lowStock());
    bus.raise();

    expect(order).to.deep.equal(['sync', 'live']);
  });

  it('keeps a synchronous failure on that handler', () => {
    const seen = [];
    bus.subscribeSync('first', ProductWithLowStock, () => {
      throw new Error('sync failed');
    });
    bus.subscribeSync('second', ProductWithLowStock, () => seen.push('second'));
    bus.events().subscribe(() => seen.push('live'));
    bus.save(lowStock());

    expect(() => bus.raise()).not.to.throw();
    expect(seen).to.deep.equal(['second', 'live']);
    expect(repository.processing).to.deep.equal([]);
  });

  it('stops a synchronous handler after unsubscribe', () => {
    const seen = [];
    const unsubscribe = bus.subscribeSync('audit', ProductWithLowStock, () => seen.push('sync'));
    unsubscribe();

    bus.save(lowStock());
    bus.raise();

    expect(seen).to.deep.equal([]);
  });

  it('does not run a durable handler from raise', () => {
    const seen = [];
    bus.subscribeDurable('stats', ProductWithLowStock, () => seen.push('durable'));
    const event = lowStock();

    bus.save(event);
    bus.raise();

    expect(seen).to.deep.equal([]);
    expect(repository.processing).to.deep.equal([]);
  });

  it('fans an event out once and marks a failed handler without losing the live event', () => {
    const seen = [];
    bus.subscribeDurable('stats', ProductWithLowStock, () => {
      throw new Error('disk');
    });
    bus.events().subscribe(event => seen.push(event));
    const event = lowStock();

    bus.save(event);
    bus.raise();
    bus.fanOut();
    bus.deliverReady();

    expect(seen).to.deep.equal([event]);
    expect(repository.events[0].dispatchedAt).to.equal(FIXED_TIME);
    expect(repository.processing).to.deep.equal([{
      eventId: 'event-1',
      subscriberName: 'stats',
      status: 'FAILED',
      attempts: 1,
      lastError: 'disk',
      updatedAt: FIXED_TIME
    }]);
  });

  it('skips an event stored before the subscriber registered', () => {
    const clock = steppingClock([
      '2026-10-11T12:00:00.000Z',
      '2026-10-11T13:00:00.000Z',
      '2026-10-11T14:00:00.000Z',
      '2026-10-11T15:00:00.000Z'
    ]);
    const opened = openBus({
      clock,
      identity: sequenceIdentity()
    });
    const seen = [];
    opened.bus.save(new OrderCreated({id: 'old', createdAt: '02/07/2017 10:00:00', lines: []}));
    opened.bus.subscribeDurable('plugin', OrderCreated, event => seen.push(event.id));
    opened.bus.fanOut();
    opened.bus.deliverReady();

    expect(seen).to.deep.equal([]);
    expect(opened.repository.processing).to.deep.equal([]);
    expect(opened.repository.events[0].dispatchedAt).to.equal('2026-10-11T14:00:00.000Z');

    opened.bus.save(new OrderCreated({id: 'new', createdAt: '02/07/2017 11:00:00', lines: []}));
    opened.bus.fanOut();
    opened.bus.deliverReady();

    expect(seen).to.deep.equal(['new']);
    expect(opened.repository.processing).to.have.lengthOf(1);
    expect(opened.repository.processing[0].status).to.equal('DONE');
  });

  it('keeps the first registration time when the subscriber is registered again', () => {
    const clock = steppingClock([
      '2026-10-11T12:00:00.000Z',
      '2026-10-11T13:00:00.000Z'
    ]);
    const opened = openBus({clock});
    opened.bus.subscribeDurable('plugin', OrderCreated, () => {});
    opened.bus.subscribeDurable('plugin', OrderCreated, () => {});

    expect(opened.repository.findSubscriber({subscriberName: 'plugin'}).registeredAt)
      .to.equal('2026-10-11T12:00:00.000Z');
  });

  it('stamps the event when it is saved and the processing row when it is claimed', () => {
    const clock = steppingClock([
      '2026-10-11T12:00:00.000Z',
      '2026-10-11T12:00:01.000Z',
      '2026-10-11T12:00:02.000Z',
      '2026-10-11T12:00:03.000Z',
      '2026-10-11T12:00:04.000Z'
    ]);
    const opened = openBus({
      clock,
      identity: {generate: () => 'event-9'}
    });
    opened.bus.subscribeDurable('plugin', OrderCreated, () => {});
    opened.bus.save(new OrderCreated({
      id: 'sale-1',
      createdAt: '02/07/2017 10:00:00',
      lines: []
    }));
    opened.bus.fanOut();
    opened.bus.deliverReady();

    expect(opened.repository.events[0].createdAt).to.equal('2026-10-11T12:00:01.000Z');
    expect(opened.repository.processingWrites.map(row => [row.status, row.updatedAt])).to.deep.equal([
      ['PENDING', '2026-10-11T12:00:02.000Z'],
      ['PROCESSING', '2026-10-11T12:00:03.000Z'],
      ['DONE', '2026-10-11T12:00:04.000Z']
    ]);
  });
});
