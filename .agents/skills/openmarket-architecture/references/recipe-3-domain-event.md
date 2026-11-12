## Recipe 3: add a domain event (and a handler)

**The current convention (already in the code):**
- Event class in `domain/event/<PastTense>.js`. It's a plain snapshot of primitives, with a static `type` and no behaviour. Register it in `domain/event/registry.js`.
- Inside the caller's transaction, `domainEventBus.record(event)` queues a live notification, and `domainEventBus.save(event)` inserts a row and queues a fact that has to last. `save` accepts a type marked `static get durable()` or a type that already has a durable subscriber. Anything else throws. After `transaction.run` emits (that is after `COMMIT`), `domainEventBus.raise()` notifies every queued event. On the error path, `discard()` drops the queue. The caller does not keep its own list. Look at `CreateOrder.createOrder`.
- The bus does not take a `Transaction`, and `SqliteTransaction` does not take the bus. `save` joins whatever transaction is already open on the shared connection.
- `ofType` is the hot stream for toasts. It does not replay. A throw is logged and does not unsubscribe the listener or fail `raise`.
- A durable handler uses `subscribeDurable`. `DomainEventDispatcher` claims the stored event and inserts one `PENDING` row per subscriber. A subscriber does not see events stored before its registration time. `RecordProductSales` is durable and idempotent on the order id. `CreateOrder` calls `dispatcher.dispatch()` right after `raise()`. The timer only retries and recovers. Start handlers before `domainEventDispatcher.start()` in `application/index.js`.
- The UI listens through an epic on `OpenMarket.get('domain_event_bus').ofType(Event)`. See `user_interface/order/new_order/epicFactory.js`.
- Delivery rules are in `docs/domain-event-bus.md`.

Checklist: event class and registry → `record` (live) or `save` (durable) inside the transaction and `raise` after it → (optional) durable handler + container factory + `.start()` in `application/index.js` before the dispatcher → unit test that the event is raised once and is not raised when the transaction fails (copy `src/test/openMarket/application/service/order/CreateOrder.spec.js`).

```js
// src/openMarket/domain/event/StockAdjusted.js
/**
 * A stocktake set a product's stock to a counted value.
 */
export default class StockAdjusted {
  /** @param {{barcode: string, previous: number, counted: number, at: string}} data */
  constructor({barcode, previous, counted, at}) {
    this.barcode = barcode;
    this.previous = previous;
    this.counted = counted;
    this.at = at;
  }
}
```
```js
// record a live event inside the transaction; raise() drains the bus queue after run emits.
// save() is for a type marked durable, or one that already has a durable subscriber.
return this._transaction.run(() => this._productRepository.save({product}).do(() => {
  this._domainEventBus.record(new StockAdjusted({barcode, previous, counted: quantity, at}));
})).do(
  () => this._domainEventBus.raise(),
  () => this._domainEventBus.discard()
).map(() => product);
```
```js
// src/openMarket/application/service/product/LogStockAdjustments.js (handler)
import StockAdjusted from '../../../domain/event/StockAdjusted';
import {record} from '../../../infrastructure/logging/ErrorLog';
/** @typedef {import('../../../domain/service/DomainEventBus').default} DomainEventBus */

export default class LogStockAdjustments {
  /** @param {{domainEventBus: DomainEventBus, adjustmentRepository: any}} deps */
  constructor({domainEventBus, adjustmentRepository}) {
    this._bus = domainEventBus;
    this._repository = adjustmentRepository;
    this._started = false;
  }
  start() {
    if (this._started) { return; }
    this._started = true;
    this._bus.ofType(StockAdjusted).subscribe(event => {
      this._repository.save({adjustment: event}).subscribe({error: error => record(error)});
    });
  }
}
```

**PROPOSAL (not in the code yet; use it only if Victor has adopted it):** aggregates *record* their events and the use case *publishes* them after the commit, so the "what happened" decision lives in the domain:
```js
// in the aggregate
this._events = [];                     // in constructor
adjustStock({counted, at}) {
  const previous = this._stock;
  this._stock = counted;
  this._events.push(new StockAdjusted({barcode: this._barcode, previous, counted, at}));
  return this;
}
pullEvents() { const events = this._events; this._events = []; return events; }
// in the use case, after the commit
// save each event inside the transaction; raise() drains the bus queue after run emits
```
