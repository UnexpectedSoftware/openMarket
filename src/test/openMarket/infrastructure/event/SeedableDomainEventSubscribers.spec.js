import {expect} from 'chai';
import SeedableDomainEventSubscribers from '../../../../openMarket/infrastructure/event/SeedableDomainEventSubscribers';

function durable(name, handler) {
  return {name, EventType: Object, handler, ordered: false, maxAttempts: 3, registeredAt: '2026-01-01T00:00:00.000Z'};
}

describe('SeedableDomainEventSubscribers', () => {
  it('passes every subscriber through until the seed bootstraps it', () => {
    const subscribers = new SeedableDomainEventSubscribers();
    const stats = durable('stats', () => 'stats');
    const plugin = durable('verifactu:submit', () => 'submitted');
    const sync = {EventType: Object, handler: () => {}};
    const live = () => {};
    subscribers.addDurable(stats);
    subscribers.addDurable(plugin);
    subscribers.addSync(sync);
    subscribers.addLive(live);

    expect(subscribers.durable()).to.deep.equal([stats, plugin]);
    expect(subscribers.sync()).to.deep.equal([sync]);
    expect(subscribers.live()).to.deep.equal([live]);
  });

  it('runs the kept handlers, stands in for the others under the same name, and silences listeners', () => {
    const subscribers = new SeedableDomainEventSubscribers();
    const stats = durable('stats', () => 'stats');
    const plugin = durable('verifactu:submit', () => 'submitted');
    subscribers.addDurable(stats);
    subscribers.addDurable(plugin);
    subscribers.addSync({EventType: Object, handler: () => {}});
    subscribers.addLive(() => {});

    expect(subscribers.seedWith({keep: ['stats']})).to.equal(subscribers);
    const [kept, standIn] = subscribers.durable();
    expect(kept).to.equal(stats);
    expect(standIn).to.include({name: 'verifactu:submit', EventType: Object, ordered: false, maxAttempts: 3});
    expect(standIn.handler()).to.equal(undefined);
    expect(subscribers.durableNamed('verifactu:submit')).to.equal(plugin);
    expect(subscribers.sync()).to.deep.equal([]);
    expect(subscribers.live()).to.deep.equal([]);

    const late = durable('late', () => 'late');
    const remove = subscribers.addDurable(late);
    expect(subscribers.durable().map(subscriber => subscriber.handler())).to.deep.equal(['stats', undefined, undefined]);

    expect(subscribers.resume()).to.equal(subscribers);
    expect(subscribers.durable()).to.deep.equal([stats, plugin, late]);
    expect(subscribers.sync()).to.have.length(1);
    expect(subscribers.live()).to.have.length(1);
    remove();
    expect(subscribers.durableNamed('late')).to.equal(null);
  });
});
