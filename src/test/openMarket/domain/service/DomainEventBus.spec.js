import { expect } from 'chai';
import DomainEventBus from '../../../../openMarket/domain/service/DomainEventBus';
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
});
