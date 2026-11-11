import {expect} from 'chai';
import DomainEventSubscribers from '../../../../openMarket/domain/service/DomainEventSubscribers';

function durable(name, handler = () => {}) {
  return {name, EventType: Object, handler, ordered: true, maxAttempts: 5, registeredAt: '2026-01-01T00:00:00.000Z'};
}

describe('DomainEventSubscribers', () => {
  it('keeps one durable subscriber per name and removes only the one it added', () => {
    const subscribers = new DomainEventSubscribers();
    const first = durable('stats');
    const removeFirst = subscribers.addDurable(first);
    const other = durable('other');
    subscribers.addDurable(other);
    const second = durable('stats');
    const removeSecond = subscribers.addDurable(second);

    removeFirst();
    expect(subscribers.durable()).to.deep.equal([second, other]);
    expect(subscribers.durableNamed('stats')).to.equal(second);
    removeSecond();
    expect(subscribers.durableNamed('stats')).to.equal(null);
    expect(subscribers.durable()).to.deep.equal([other]);
  });

  it('lists sync and live listeners in the order they came and removes each once', () => {
    const subscribers = new DomainEventSubscribers();
    const sync = {EventType: Object, handler: () => {}};
    const removeSync = subscribers.addSync(sync);
    const first = () => {};
    const second = () => {};
    const removeFirst = subscribers.addLive(first);
    subscribers.addLive(second);

    expect(subscribers.sync()).to.deep.equal([sync]);
    expect(subscribers.live()).to.deep.equal([first, second]);
    subscribers.live().length = 0;
    removeFirst();
    removeFirst();
    removeSync();
    expect(subscribers.live()).to.deep.equal([second]);
    expect(subscribers.sync()).to.deep.equal([]);
  });
});
