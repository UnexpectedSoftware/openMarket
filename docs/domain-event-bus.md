# Domain event bus

`DomainEventBus` stores facts and notifies in-memory listeners after those facts have committed. A use case does not call the UI, the statistics writer, or a plugin itself.

The container builds one bus on the shared SQLite connection and stores it as `domainEventBus`. The UI reads that same instance with `OpenMarket.get('domain_event_bus')`. `DomainEventDispatcher` claims durable work on a timer. The bus does not take a `Transaction`, and `SqliteTransaction` does not take the bus.

A use case saves inside its transaction and raises on the observable that comes out of `transaction.run`. That observable emits only after `COMMIT`.

```js
return transaction.run(() => work.do(() => {
  domainEventBus.save(new OrderCreated({id, createdAt, lines}));
})).do(
  () => domainEventBus.raise(),
  () => domainEventBus.discard()
);
```

`save` inserts the row and holds the event on the bus. `raise()` takes no argument: it notifies every event saved since the last `raise`. `discard()` drops that queue when the transaction rolls back, so a later `raise` cannot announce a fact that was undone. The caller does not keep its own list of events.

`EnableProduct` has no surrounding transaction. `save` inserts one row, which commits on its own, and `raise()` runs immediately after.

## What gets stored

`save` inserts one row into `domain_event`:

| Column | Meaning |
| --- | --- |
| `id` | Id from `RandomUUIDIdentity` |
| `type` | Stable name, such as `OrderCreated` |
| `payload` | JSON snapshot of the event fields |
| `aggregate_id` | Order id, otherwise barcode. Empty when the event has neither |
| `created_at` | ISO-8601 UTC timestamp from the injected clock |
| `dispatched_at` | Empty until durable subscribers have been claimed. Empty means the scanner has not seen it |

`domain_event_subscriber` stores the first time a durable name was registered. A later registration keeps that time. Events with `created_at` earlier than it are not given to that subscriber.

`domain_event_processing` is written by the dispatcher, not by `save`:

| Column | Meaning |
| --- | --- |
| `event_id` | `domain_event.id` |
| `subscriber_name` | Name passed to `subscribeDurable` |
| `status` | `PENDING`, `PROCESSING`, `DONE`, `FAILED`, or `DEAD` |
| `attempts` | How many times the handler has been claimed |
| `last_error` | Message from the latest failure |
| `updated_at` | ISO-8601 UTC timestamp from the injected clock |

`PENDING` is waiting. `PROCESSING` is claimed. `DONE` finished. `FAILED` will be tried again. `DEAD` will not.

`save` joins a transaction that is already open on the connection, so a rollback removes the event with the business write. The dispatcher claims rows only when no transaction is open. It marks the event dispatched and inserts one `PENDING` row per eligible subscriber in that claim. A subscriber registered for another event type, or registered after the event was stored, gets no row.

## Three ways to listen

### Live listeners

`ofType` and `events` are the hot stream. `raise` is what pushes to them.

```js
domainEventBus.ofType(ProductWithLowStock).subscribe(event => {
  // show a toast
});
```

- The listener sees only events raised after it subscribes. Nothing is replayed.
- `CreateOrder` raises after the sale commits, so the listener sees `database.isTransaction === false`.
- A throw here does not roll the business write back. That write is already committed.
- The listener is not recorded in `domain_event_processing` and is not retried after a restart.

The low-stock toast and the product-enabled toast listen this way.

### Synchronous subscribers

```js
const stop = domainEventBus.subscribeSync('audit', OrderCreated, event => {
  // runs from raise, after the commit
});
```

- The handler runs during `raise`, before live listeners for that event.
- The fact has already committed. A throw does not roll it back, and `raise` does not throw. Later synchronous handlers and live listeners still run.
- The handler is not recorded and is not retried.
- Handlers for one event run in registration order.
- The function returned by `subscribeSync` removes that handler.

### Durable subscribers

```js
domainEventBus.subscribeDurable('notify-warehouse', OrderCreated, event => {
  // at least once, after commit
}, {ordered: true, maxAttempts: 5});
```

- `save` and `raise` do not call the handler and do not insert a processing row.
- `DomainEventDispatcher` scans on a one-second timer, and `dispatch()` does one scan now. The timer does not keep the process alive.
- A scan claims every event with an empty `dispatched_at`, inserts the `PENDING` rows, then runs handlers that are free to run. The claim uses its own short transaction.
- The handler does not join the business transaction.
- A throw marks the row `FAILED` and stores `last_error`. The business transaction stays committed.
- `processPending()` tries a `FAILED` row again. The attempt count stops at `maxAttempts` (default 5). The last failure is marked `DEAD`.
- A `DEAD` row is not tried again.
- Delivery is at least once. A crash after the handler's own write, and before the row is marked `DONE`, runs the handler again. Handlers need to tolerate a duplicate.
- With `ordered: true` (the default), a subscriber does not receive a later event while an earlier one is `FAILED` or still waiting. Order is the event insert order (`rowid`).
- With `ordered: false`, a later event is delivered while an older one is still failing.
- The function returned by `subscribeDurable` removes that handler. Rows already stored under its name stay in the table.
- `dispatch()` resets rows left in `PROCESSING` by a crash. An interrupted attempt counts. When the attempt count has already reached the maximum, the row is marked `DEAD` with `stopped while processing`. Otherwise it returns to `PENDING` and is delivered again.
- An event with no eligible subscriber is still marked dispatched, so the scanner does not visit it again.

`RecordProductSales` is the durable subscriber `record-product-sales`. It adds the order to `product_sale_day` in its own transaction and records the order id in `product_sale_order`. The same order id is applied once, so the retry does not add the quantity again. `ordered` is false, so one failed order does not hold the next sale. A statistics failure leaves the sale in place.

Register durable subscribers before `DomainEventDispatcher.start()`. The app starts `RecordProductSales` first, then the dispatcher.

## Public events

Each class has a `type` string. The payload is the fields passed to the constructor.

### `OrderCreated`

Saved by `CreateOrder` inside the sale transaction, after the order, its lines, and the stock update. Raised after that transaction commits.

| Field | Meaning |
| --- | --- |
| `id` | Order id |
| `createdAt` | Sale timestamp stored on the order (`DD/MM/YYYY HH:mm:ss`) |
| `lines` | Snapshot of `{barcode, name, price, quantity}` for each line |

`aggregate_id` is the order id. Later edits to a product do not change this snapshot.

### `ProductWithLowStock`

Saved by `CreateOrder` for each sold product whose remaining stock is less than or equal to its minimum, inside the same transaction. Raised after the commit. The same sale can save one `OrderCreated` and several of these. Low stock does not reject the sale.

| Field | Meaning |
| --- | --- |
| `barcode` | Product barcode |
| `name` | Product name |
| `stock` | Stock after the sale |
| `stockMin` | Minimum stock |

`aggregate_id` is the barcode. The order screen listens with `ofType` and shows the low-stock toast.

### `ProductEnabledAgain`

Saved and raised by `EnableProduct` when a cashier scans a disabled product. The product is enabled and its stock grows by one before the event is saved. That product write commits on its own, then the event row commits, then `raise` runs.

| Field | Meaning |
| --- | --- |
| `barcode` | Product barcode |
| `name` | Product name |

`aggregate_id` is the barcode. The order screen listens with `ofType` and shows the warning toast. A second scan of an already enabled product does not save the event.

## What stays unaware of the tables

Use cases, entities, and `ofType` listeners do not import the repository. They save, raise, or subscribe through `DomainEventBus`. `SqliteDomainEventRepository` only saves and finds rows. Retries and dead letters stay on the bus. The dispatcher owns the claim transaction. The container wires the repository, `RandomUUIDIdentity`, `SystemClock`, and the dispatcher.
