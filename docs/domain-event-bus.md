# Domain event bus

`DomainEventBus` is the in-process bus for facts the domain has already decided. A use case publishes an event. It does not call the UI, the statistics writer, or a plugin itself.

The container builds one bus on the shared SQLite connection and stores it as `domainEventBus`. The UI reads that same instance with `OpenMarket.get('domain_event_bus')`.

Publishing stays a single call:

```js
domainEventBus.publish(new OrderCreated({id, createdAt, lines}));
```

The bus persists the event, runs synchronous handlers, and records durable handlers. Callers do not open the event tables.

## What gets stored

Every event published through the wired bus is inserted into `domain_event`:

| Column | Meaning |
| --- | --- |
| `id` | Id from `RandomUUIDIdentity` |
| `type` | Stable name, such as `OrderCreated` |
| `payload` | JSON snapshot of the event fields |
| `aggregate_id` | Order id, otherwise barcode. Empty when the event has neither |
| `created_at` | ISO-8601 UTC timestamp from the injected clock |

Durable subscribers also get a row in `domain_event_processing`:

| Column | Meaning |
| --- | --- |
| `event_id` | `domain_event.id` |
| `subscriber_name` | Name passed to `subscribeDurable` |
| `status` | `PENDING`, `PROCESSING`, `DONE`, `FAILED`, or `DEAD` |
| `attempts` | How many times the handler has been claimed |
| `last_error` | Message from the latest failure |
| `updated_at` | ISO-8601 UTC timestamp from the injected clock |

`PENDING` is waiting. `PROCESSING` is claimed. `DONE` finished. `FAILED` will be tried again. `DEAD` will not.

The rows are written on the connection that is already open. Inside `transaction.run` they join that transaction. A rollback removes the event and its processing rows together with the business write.

## Three ways to listen

### Live listeners

`ofType` and `events` are the existing hot stream.

```js
domainEventBus.ofType(ProductWithLowStock).subscribe(event => {
  // show a toast
});
```

- The listener sees only events published after it subscribes. Nothing is replayed.
- An event published inside a transaction is delivered after `COMMIT`, once `database.isTransaction` is false.
- An event published with no transaction open is delivered as soon as its own insert commits.
- A throw here does not roll the business write back. That write is already committed.
- The listener is not recorded in `domain_event_processing` and is not retried after a restart.

`RecordProductSales` listens this way. It updates `product_sale_day` in its own transaction after the sale commits. A statistics failure is logged and leaves the sale in place. A crash between the two commits can still drop that statistics update, because a live listener is not replayed. The sale totals are not idempotent, so this listener stays live rather than durable.

### Synchronous subscribers

```js
const stop = domainEventBus.subscribeSync('reserve-stock', OrderCreated, event => {
  // runs before COMMIT, on the same connection
});
```

- The handler runs during `publish`, before the transaction commits.
- It sees `database.isTransaction === true` when the caller published inside a transaction.
- Writes it makes on that same connection join the transaction.
- If the handler throws, `publish` throws the same error. `SqliteTransaction` rolls the transaction back and the error reaches the use-case subscriber.
- Live listeners are not called. Durable rows for that event are not kept.
- Handlers for one event run in registration order. The first throw stops the later ones.
- The handler must not call `BEGIN`. The transaction is already open.
- The function returned by `subscribeSync` removes that handler. A later event does not call it.

`CreateOrder` publishes `OrderCreated` and `ProductWithLowStock` inside the sale transaction, after the order, its lines, and the stock update. A synchronous failure undoes all of those.

`EnableProduct` publishes `ProductEnabledAgain` after the product row is saved. That publish opens a short transaction for the event only. A synchronous handler can roll the event insert back. It does not roll the product update back, because that update is already committed.

### Durable subscribers

```js
domainEventBus.subscribeDurable('notify-warehouse', OrderCreated, event => {
  // at least once, after commit
}, {ordered: true, maxAttempts: 5});
```

- `publish` inserts a `PENDING` row for each durable subscriber whose event type matches.
- The handler runs after commit. It does not join the business transaction.
- A throw marks the row `FAILED` and stores `last_error`. The business transaction stays committed.
- The bus tries again until the handler returns or the attempt count reaches `maxAttempts` (default 5). The last failure is marked `DEAD`.
- A `DEAD` row is not tried again.
- Delivery is at least once. A crash after the handler's own write, and before the row is marked `DONE`, runs the handler again. Handlers need to tolerate a duplicate.
- With `ordered: true` (the default), a subscriber does not receive a later event while an earlier one is `FAILED` or still waiting. Order is the insert order (`rowid`).
- With `ordered: false`, a later event is delivered while an older one is still failing.
- `processPending()` runs one retry and then the pending rows that are free to run. The app also does this on a one-second timer after the first durable subscriber is registered. The timer does not keep the process alive.
- The function returned by `subscribeDurable` removes that handler. Rows already stored under its name stay in the table.
- `start()` resets rows left in `PROCESSING` by a crash. An interrupted attempt counts. When the attempt count has already reached the maximum, the row is marked `DEAD` with `stopped while processing`. Otherwise it returns to `PENDING` and is delivered again.

A subscriber registered after an event was published does not receive that event. Restarting the process does deliver rows that are still `PENDING` or `FAILED`, once the same subscriber name is registered and `start()` runs.

## Publishing rules

1. Insert `domain_event`.
2. Run synchronous handlers. A throw stops here and the surrounding transaction rolls back.
3. Insert `PENDING` rows for durable subscribers registered before this publish.
4. Commit.
5. Notify `ofType` listeners.
6. Run durable handlers that are still `PENDING`.

The constructor requires a repository, a transaction, an identity, and a clock. There is no in-memory bus. `created_at` and each processing `updated_at` are whatever `clock.now()` returns. The container passes `SystemClock`, which returns the current time as an ISO-8601 UTC string. A test passes a clock that returns a chosen time.

## Public events

Each class has a `type` string. The payload is the fields passed to the constructor.

### `OrderCreated`

Published by `CreateOrder` after the order and the stock update have been written, still inside the sale transaction.

| Field | Meaning |
| --- | --- |
| `id` | Order id |
| `createdAt` | Sale timestamp stored on the order (`DD/MM/YYYY HH:mm:ss`) |
| `lines` | Snapshot of `{barcode, name, price, quantity}` for each line |

`aggregate_id` is the order id. Later edits to a product do not change this snapshot.

### `ProductWithLowStock`

Published by `CreateOrder` for each sold product whose remaining stock is less than or equal to its minimum. The same sale can publish one `OrderCreated` and several of these. Low stock does not reject the sale.

| Field | Meaning |
| --- | --- |
| `barcode` | Product barcode |
| `name` | Product name |
| `stock` | Stock after the sale |
| `stockMin` | Minimum stock |

`aggregate_id` is the barcode. The order screen listens with `ofType` and shows the low-stock toast.

### `ProductEnabledAgain`

Published by `EnableProduct` when a cashier scans a disabled product. The product is enabled and its stock grows by one before the event is published.

| Field | Meaning |
| --- | --- |
| `barcode` | Product barcode |
| `name` | Product name |

`aggregate_id` is the barcode. The order screen listens with `ofType` and shows the warning toast. A second scan of an already enabled product does not publish the event.

## What stays unaware of the tables

Use cases, entities, and `ofType` listeners do not import the repository. They publish or subscribe through `DomainEventBus`. `SqliteDomainEventRepository` only saves and finds rows in the two tables. Retries, dead letters, and transaction boundaries stay on the bus and on `Transaction`. `SqliteTransaction` extends that port. The container is the only place that wires the repository, the transaction, `RandomUUIDIdentity`, and `SystemClock` in.
