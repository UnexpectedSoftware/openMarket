# Domain event bus

`DomainEventBus` stores facts that have to last and notifies in-memory listeners after those facts have committed. A use case does not call the UI, the statistics writer, or a plugin itself.

The container builds one bus on the shared SQLite connection and stores it as `domainEventBus`. The UI reads that same instance with `OpenMarket.get('domain_event_bus')`. `DomainEventDispatcher` claims durable work. `CreateOrder` calls `dispatch()` as soon as the sale commits. The one-second timer only retries a failed handler and recovers work left by a crash. The bus does not take a `Transaction`, and `SqliteTransaction` does not take the bus.

A use case queues the event inside its transaction and raises on the observable that comes out of `transaction.run`. That observable emits only after `COMMIT`.

```js
return transaction.run(() => work.do(() => {
  domainEventBus.save(new OrderCreated({id, createdAt, lines}));
})).do(
  () => {
    domainEventBus.raise();
    domainEventDispatcher.dispatch();
  },
  () => domainEventBus.discard()
);
```

`save` inserts a `domain_event` row and holds the event on the bus. `record` holds the event without inserting a row. `raise()` takes no argument: it notifies every event queued since the last `raise`. `discard()` drops that queue when the transaction rolls back, so a later `raise` cannot announce a fact that was undone. The caller does not keep its own list of events.

`save` persists a type that is marked durable (`static get durable()` returns true, as `OrderCreated` does) or that already has a durable subscriber. Any other type throws `Domain event <type> is not durable`. Use `record` for a toast or another live notification, as `CreateOrder` does for `ProductWithLowStock` and `EnableProduct` does for `ProductEnabledAgain`.

`EnableProduct` wraps the product write in `transaction.run`, records the event inside that transaction, and raises after commit.

## What gets stored

`save` inserts one row into `domain_event`. `record` does not:

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

`save` joins a transaction that is already open on the connection, so a rollback removes the event with the business write. `record` has nothing to roll back. The dispatcher claims rows only when no transaction is open. It marks the event dispatched and inserts one `PENDING` row per eligible subscriber in that claim. A subscriber registered for another event type, or registered after the event was stored, gets no row.

## Three ways to listen

### Synchronous subscribers

`subscribeSync` runs from `save`, after the durable check and before the `domain_event` insert. The caller's transaction is still open. `record` does not call it, and `raise` does not call it.

```js
domainEventBus.subscribeSync(OrderCreated, event => {
  // local write on the shared connection
});
```

- The handler must be fast, local, and deterministic. Network and other external work belong in `subscribeDurable`.
- The handler's writes on the shared connection join the open transaction. The bus does not take a `Transaction`.
- A throw aborts `save`. The transaction rolls back, no `domain_event` row is inserted, and the event is not queued for `raise`.
- If a matching handler is registered and no transaction is open, `save` throws `Sync subscriber for <type> ran outside a transaction` and inserts nothing.
- The handler is in memory for this process. It is not stored, and it is not retried.
- Plugins receive a wrapper that only exposes `subscribeSync`, `subscribeDurable`, and `ofType`. See `docs/plugins.md`.

`subscribeSync` was removed while the bus had no caller for it. Plugins need a write that commits with the sale, so it is part of the bus again.

### Live listeners

`ofType` and `events` are the hot stream. `raise` is what pushes to them. A queued `save` and a queued `record` both arrive here.

```js
domainEventBus.ofType(ProductWithLowStock).subscribe(event => {
  // show a toast
});
```

- The listener sees only events raised after it subscribes. Nothing is replayed.
- `CreateOrder` and `EnableProduct` raise after their transaction commits, so the listener sees `database.isTransaction === false`.
- A throw is logged through the JSON error log and does not unsubscribe the listener. The other listeners for that event still run, and the rest of the batch is still delivered. `raise` does not throw, so a toast cannot fail a sale that has already committed.
- The listener is not recorded in `domain_event_processing` and is not retried after a restart.

The low-stock toast and the product-enabled toast listen this way.

### Durable subscribers

```js
domainEventBus.subscribeDurable('notify-warehouse', OrderCreated, event => {
  // at least once, after commit
}, {ordered: true, maxAttempts: 5});
```

- `save` and `raise` do not call the handler and do not insert a processing row. `record` never creates a row for the handler to claim.
- `DomainEventDispatcher.dispatch()` claims every event with an empty `dispatched_at`, inserts the `PENDING` rows in its own short transaction, then runs handlers that are free to run. `CreateOrder` calls it immediately after `raise()`. The one-second timer calls the same scan, then retries `FAILED` rows. The timer does not keep the process alive. A throw from the timer is written to the JSON error log. The timer stays up.
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

Register durable subscribers before `DomainEventDispatcher.start()`. The app starts `PluginHost`, then `RecordProductSales`, then the dispatcher. `PluginHost` registers enabled plugins before that first scan.

## Public events

Each class has a `type` string. The payload is the fields passed to the constructor.

### `OrderCreated`

Saved by `CreateOrder` inside the sale transaction, after the order, its lines, and the stock update. The type is marked durable, so the row is stored even before a subscriber exists. Raised after that transaction commits. `CreateOrder` then calls `dispatch()`, so a durable subscriber such as `RecordProductSales` has already run when the sale observable emits.

| Field | Meaning |
| --- | --- |
| `id` | Order id |
| `createdAt` | Sale timestamp stored on the order (`DD/MM/YYYY HH:mm:ss`) |
| `lines` | Snapshot of `{barcode, name, price, quantity}` for each line |

`aggregate_id` is the order id. Later edits to a product do not change this snapshot.

```json
{
  "id": "6f1c0b9e-1b2a-4c3d-9e8f-0a1b2c3d4e5f",
  "createdAt": "02/07/2017 10:00:00",
  "lines": [
    {"barcode": "0001", "name": "Coca-Cola", "price": 0.55, "quantity": 1}
  ]
}
```

### `InvoiceIssued`

Saved by `IssueInvoice` inside the issuance transaction, after the invoice and its lines are inserted and after the series sequence has moved forward. The type is marked durable, so the row is stored even before a subscriber exists. Raised after that transaction commits. `IssueInvoice` then calls `dispatch()`.

`subscribeSync` runs from `save`, before the `domain_event` insert, while the invoice insert and the sequence update are still uncommitted. A throw rolls all of them back, and the number can be used again. `record` is not used: a subscriber that must see the issued document after a restart needs the stored row.

| Field | Meaning |
| --- | --- |
| `id` | Invoice id |
| `series` | Series, such as `2026` or `A` |
| `number` | Integer within that series |
| `invoiceNumber` | Formatted number, such as `2026/000001` or `A/000123` |
| `issuedAt` | Issue time, ISO-8601 UTC |
| `orderId` | Order this invoice was issued for, or `null` |
| `lines` | Snapshot of `{barcode, name, price, quantity, amount}` for each line |
| `total` | Sum of the line amounts |

`aggregate_id` is the invoice id. Later edits to a product or to the order do not change this snapshot. Cancelling the invoice does not change it either.

```json
{
  "id": "6f1c0b9e-1b2a-4c3d-9e8f-0a1b2c3d4e5f",
  "series": "2026",
  "number": 1,
  "invoiceNumber": "2026/000001",
  "issuedAt": "2026-10-14T12:00:00.000Z",
  "orderId": null,
  "lines": [
    {"barcode": "0001", "name": "Coca-Cola", "price": 0.55, "quantity": 1, "amount": 0.55}
  ],
  "total": 0.55
}
```

### `InvoiceCancelled`

Saved by `CancelInvoice` inside the cancellation transaction, after the invoice status has been set to cancelled. The type is marked durable. Raised after that transaction commits. `CancelInvoice` then calls `dispatch()`. The number, the lines, and the total are the issued snapshot. A second cancellation does not save another event.

| Field | Meaning |
| --- | --- |
| `id` | Invoice id |
| `series` | Series |
| `number` | Integer within that series |
| `invoiceNumber` | Formatted number |
| `issuedAt` | Original issue time, ISO-8601 UTC |
| `cancelledAt` | Cancellation time, ISO-8601 UTC |
| `orderId` | Order this invoice was issued for, or `null` |
| `lines` | Issued snapshot of `{barcode, name, price, quantity, amount}` |
| `total` | Issued total |

`aggregate_id` is the invoice id.

```json
{
  "id": "6f1c0b9e-1b2a-4c3d-9e8f-0a1b2c3d4e5f",
  "series": "2026",
  "number": 1,
  "invoiceNumber": "2026/000001",
  "issuedAt": "2026-10-14T12:00:00.000Z",
  "cancelledAt": "2026-10-14T15:00:00.000Z",
  "orderId": null,
  "lines": [
    {"barcode": "0001", "name": "Coca-Cola", "price": 0.55, "quantity": 1, "amount": 0.55}
  ],
  "total": 0.55
}
```

### `ProductWithLowStock`

Recorded by `CreateOrder` for each sold product whose remaining stock is less than or equal to its minimum, inside the same transaction. Raised after the commit. It is not stored in `domain_event`. The same sale can save one `OrderCreated` and record several of these. Low stock does not reject the sale.

| Field | Meaning |
| --- | --- |
| `barcode` | Product barcode |
| `name` | Product name |
| `stock` | Stock after the sale |
| `stockMin` | Minimum stock |

The order screen listens with `ofType` and shows the low-stock toast. There is no `domain_event` row and no `domain_event_processing` row.

```json
{"barcode": "0001", "name": "Coca-Cola", "stock": 4, "stockMin": 10}
```

### `ProductEnabledAgain`

Recorded and raised by `EnableProduct` when a cashier scans a disabled product. The product is enabled and its stock grows by one inside `transaction.run`, the event is recorded in that same transaction, and `raise` runs after commit. The event is not stored.

| Field | Meaning |
| --- | --- |
| `barcode` | Product barcode |
| `name` | Product name |

The order screen listens with `ofType` and shows the warning toast. A second scan of an already enabled product does not record the event.

```json
{"barcode": "0001", "name": "Coca-Cola"}
```

## What stays unaware of the tables

Use cases, entities, and `ofType` listeners do not import the repository. They save, record, raise, or subscribe through `DomainEventBus`. `SqliteDomainEventRepository` only saves and finds rows. Retries and dead letters stay on the bus. The dispatcher owns the claim transaction. The container wires the repository, `RandomUUIDIdentity`, `SystemClock`, the error log, and the dispatcher.
