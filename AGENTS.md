# OpenMarket: rules for coding agents

Electron 44 point-of-sale app. React 15 + Redux 3 + redux-observable, RxJS 5, SQLite (`node:sqlite`), plain JavaScript (no TypeScript files).
Architecture: DDD with a hexagonal layout. **Read this file before writing code.** For step-by-step recipes, use the `openmarket-architecture` skill.

## Layers (`src/openMarket/`)

| Folder | Holds | May import |
|---|---|---|
| `domain/` | Aggregates (`Product`, `Order`, `Category`), value objects, ports (`@interface` classes), domain events (`domain/event/`), errors (`*Error` + `error/ErrorCode.js`) | other domain files only. No fs, sqlite, electron, react |
| `application/` | Use cases in `application/service/<context>/<VerbNoun>.js`; the facade `application/index.js` | `domain/`, `infrastructure/logging/` (error logging). Only `index.js` may import the container |
| `infrastructure/` | Adapters (`Sqlite<Name>Repository`, `Sql<Name>Mapper`, `<Name>FactoryImpl`, `OpenFoodFacts…Source`), SQL helpers (`Sqlite<Name>QueryService`), printer, logging, DI container `dic/Container.js` | anything below it |
| `user_interface/` | React/Redux/epics | `application/index.js` (`OpenMarket.get('<key>')`), `domain/` for read-only constants and events, `infrastructure/logging/` |

The dependency rule: dependencies point inwards (UI → application → domain). Infrastructure implements domain ports and is wired in `infrastructure/dic/Container.js`. `src/test/openMarket/architecture/architecture.spec.js` enforces this.

## Naming (copy exactly)

| Thing | Name / place |
|---|---|
| Persistence port | `domain/<ctx>/<Name>Repository.js`, an `@interface` class whose methods throw `'<Port>#<method> must be implemented'` |
| Persistence adapter | `infrastructure/<ctx>/Sqlite<Name>Repository.js` |
| SQL helper for one repository | `infrastructure/<ctx>/Sqlite<Name>QueryService.js`. Injected only into that repository, never into use cases |
| Row ↔ aggregate | `infrastructure/<ctx>/Sql<Name>Mapper.js` |
| Factory | port `domain/<ctx>/<Name>Factory.js`, impl `infrastructure/<ctx>/<Name>FactoryImpl.js` |
| External source | port `domain/<ctx>/<Thing>Source.js`, adapter `infrastructure/<ctx>/<Vendor><Thing>Source.js` |
| Use case | `application/service/<ctx>/<VerbNoun>.js`, one public method named after the action (`createOrder`, `enableForSale`) |
| Domain event | `domain/event/<PastTense>.js`, a plain data class (`OrderCreated`, `ProductEnabledAgain`) |
| Error | `domain/<ctx>/<Name>Error.js extends AppError`, plus a new key in `domain/error/ErrorCode.js` |

**Never** use `*Store`, `*Dao`, `*Manager`, `*Helper` or `*Service` for persistence of an aggregate. `ImageStore` (photo files on disk) is the only `*Store`.

## Golden rules

1. **Repositories are collections.** They have `save`, `findById`/`findBy<Key>`, `findAll(filter)`, `remove`, and read-only counts. They load and store aggregates and contain **no business decisions** (no stock math, no status changes, no totals, no "if disabled then…").
2. **Behaviour lives in aggregates.** Use case pattern: load → call aggregate methods (`product.addStock`, `product.enable`, `product.subtractStock`) → `save`. Never assign `product._field` from outside.
3. **Use cases orchestrate.** They depend on **ports** passed in the constructor (`constructor({productRepository, …})`), never on `Sqlite*` classes. Several writes go inside `transaction.run(() => …)`.
4. **Events:** inside the caller's transaction the use case calls `domainEventBus.save(event)`. `save` stores the row and queues the event on the bus. After `transaction.run` emits, `domainEventBus.raise()` notifies every queued event. On the error path, `domainEventBus.discard()` drops the queue so a rolled-back fact is not announced later. `raise` notifies `ofType` and `subscribeSync` listeners; those cannot roll the fact back. Durable handlers are claimed later by `DomainEventDispatcher`, one `PENDING` row per subscriber, and a subscriber ignores events stored before its registration time. The bus does not take a `Transaction`, and `SqliteTransaction` does not take the bus. Handlers start in `application/index.js`.
5. **Errors:** throw or emit a typed `AppError` subclass with a code. In Rx code use `observableError(new XError({...}))`. In sync code use `raise(...)`. Never use `new Error('some string')` for a shop failure.
6. **Wiring:** each new class gets a `_camelName()` factory in `infrastructure/dic/Container.js`. Use cases the UI needs are added to `application/index.js` as `'<ctx>_<action>_use_case'`.
7. **Types are JSDoc only.** Destructured params look like `@param {{barcode: string}} query`. Type-only imports use `/** @import X from '…' */`. New adapters use `/** @implements {Port} */` and do not use `extends Port`. Don't create `.ts` files.
8. **No new debt.** Don't add lines to `KNOWN_VIOLATIONS` in the architecture test. Don't copy the old exceptions listed there.

## Do / Don't

```js
// DON'T
class StockStore { decrease(barcode, qty) { /* UPDATE product SET stock = stock - ? … */ } }
// DO: domain/product/Product.js has subtractStock(); the use case does:
productRepository.findByBarcode({barcode})
  .map(product => product.subtractStock({quantity}))
  .flatMap(product => productRepository.save({product}).map(() => product));
```

## Commands (run before you say you're done)

- `npm ci` (Node 24+)
- `npm test` for unit tests, including the architecture test. `npm run test:integration` runs SQLite integration tests. `npm run test-all` runs both.
- `npm run typecheck` if it exists in `package.json`
- `npm run build`, then `xvfb-run -a npm run test:ui` for Playwright e2e when UI flows change

Tests go in `src/test/openMarket/<layer>/<ctx>/<Name>.spec.js` (mocha + chai, ports faked with plain objects returning `Rx.Observable.of(...)`), `src/itest/<Ctx>Spec.js` (real container + test SQLite file under the OS temp dir) and `e2e/*.spec.js`.

## Pull requests

The body must contain `Version: none|patch|minor|major`, and `package.json` must match (CI checks this). Keep the description short and factual.
